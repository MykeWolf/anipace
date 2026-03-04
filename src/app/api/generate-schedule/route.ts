import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import type {
  GenerateScheduleRequest,
  GenerateScheduleApiResponse,
  ScheduleDay,
  ScheduleWeek,
  ScheduleSummary,
  ApiError,
} from "@/types";

// ── In-memory rate limiting ───────────────────────────────────────────────────
//
// Counters live at module scope so they persist across requests within the same
// server process. On Vercel Serverless a cold start resets them — limits are
// therefore "soft" but sufficient for a free-tier personal project.

const RATE_LIMIT_MAX    = 10;       // max requests per IP per window
const RATE_LIMIT_WINDOW = 3_600_000; // 1 hour in ms
const DAILY_CAP         = 200;      // global requests per UTC day

/** Per-IP store: ip → { count, windowStart } */
const ipStore = new Map<string, { count: number; windowStart: number }>();

/** Global daily counter, keyed by UTC date string "YYYY-MM-DD" */
let dailyCounter = { count: 0, date: "" };

/** Extract the best available client IP from the request headers. */
function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    req.ip ??       // Next.js direct IP (dev server / some Vercel configs)
    "unknown"
  );
}

/**
 * Increment and check the per-IP sliding-window counter.
 * Returns true if the request is allowed, false if rate-limited.
 */
function checkIpRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipStore.get(ip);

  if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW) {
    // First request or window expired — start a fresh window
    ipStore.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false; // over limit
  entry.count++;
  return true;
}

/**
 * Increment and check the global UTC-day counter.
 * Returns true if the request is allowed, false if the daily cap is reached.
 */
function checkDailyCap(): boolean {
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD" UTC
  if (dailyCounter.date !== today) {
    // New UTC day — reset
    dailyCounter = { count: 1, date: today };
    return true;
  }
  if (dailyCounter.count >= DAILY_CAP) return false; // over daily limit
  dailyCounter.count++;
  return true;
}

// ── Day helpers ───────────────────────────────────────────────────────────────

type DayKey =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

const DAY_KEYS: DayKey[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

type DayName = (typeof DAY_NAMES)[number];
type DayPattern = Record<DayKey, number>;

function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// ── Schedule generator ────────────────────────────────────────────────────────
//
// Mirrors generateSimpleSchedule (client-side) but accepts a per-day-of-week
// episode count (the "day pattern") returned by Gemini, then expands it into
// the full ScheduleWeek[] / ScheduleSummary the frontend expects.

function generateFromDayPattern(
  totalEpisodes: number,
  episodeDurationMinutes: number,
  startDate: string,
  dayPattern: DayPattern
): { weeks: ScheduleWeek[]; summary: ScheduleSummary } {
  const currentDate = parseISODate(startDate);
  let remainingEps = totalEpisodes;
  let currentEp = 1;
  const allDays: ScheduleDay[] = [];

  // 10-year safety cap (prevents infinite loop if pattern is all zeros)
  const MAX_DAYS = 3650;

  while (remainingEps > 0 && allDays.length < MAX_DAYS) {
    const jsDay = currentDate.getDay(); // 0 = Sun … 6 = Sat
    const dayKey = DAY_KEYS[jsDay];
    const epsAllowed = dayPattern[dayKey] ?? 0;

    // Never exceed remaining episodes on the last day
    const epsToday = Math.min(Math.max(0, epsAllowed), remainingEps);

    allDays.push({
      date: formatISODate(currentDate),
      dayOfWeek: DAY_NAMES[jsDay] as DayName,
      episodes:
        epsToday > 0
          ? { from: currentEp, to: currentEp + epsToday - 1 }
          : null,
      estimatedMinutes: epsToday * episodeDurationMinutes,
    });

    if (epsToday > 0) {
      currentEp += epsToday;
      remainingEps -= epsToday;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Group every 7 consecutive days into a ScheduleWeek
  const weeks: ScheduleWeek[] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push({
      weekNumber: Math.floor(i / 7) + 1,
      days: allDays.slice(i, i + 7),
    });
  }

  const lastDay = allDays[allDays.length - 1];
  const projectedFinishDate = lastDay?.date ?? startDate;
  const totalWeeks = weeks.length;
  const totalWatchHours = parseFloat(
    ((totalEpisodes * episodeDurationMinutes) / 60).toFixed(1)
  );
  const episodesPerWeekAvg = parseFloat(
    (totalEpisodes / Math.max(totalWeeks, 1)).toFixed(1)
  );

  return {
    weeks,
    summary: {
      totalWeeks,
      episodesPerWeekAvg,
      totalWatchHours,
      projectedFinishDate,
    },
  };
}

// ── POST /api/generate-schedule ───────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // ── 1. Global daily cap ────────────────────────────────────────────────
  // Check before reading the body — if we're over budget, reject immediately.
  if (!checkDailyCap()) {
    return NextResponse.json<ApiError>(
      {
        error:
          "The AI scheduler has reached its daily limit. Please try again tomorrow, or use Simple Mode instead.",
      },
      { status: 429 }
    );
  }

  // ── 2. Per-IP rate limit ───────────────────────────────────────────────
  const ip = getClientIp(request);
  if (!checkIpRateLimit(ip)) {
    return NextResponse.json<ApiError>(
      {
        error:
          "Too many requests. Please wait a while before generating another schedule.",
      },
      { status: 429 }
    );
  }

  // ── Parse request body ─────────────────────────────────────────────────
  let body: GenerateScheduleRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiError>(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const { animeTitle, totalEpisodes, episodeDuration, startDate, targetDate, mode, ai } =
    body;

  if (!animeTitle || !totalEpisodes || !startDate || !targetDate || !mode) {
    return NextResponse.json<ApiError>(
      { error: "Missing required fields." },
      { status: 400 }
    );
  }

  if (mode !== "ai") {
    return NextResponse.json<ApiError>(
      { error: "This route only handles AI mode. Simple mode runs client-side." },
      { status: 400 }
    );
  }

  if (!ai?.userScheduleDescription?.trim()) {
    return NextResponse.json<ApiError>(
      { error: "Describe your weekly schedule to use AI Mode." },
      { status: 400 }
    );
  }

  // ── 3. Input length cap ────────────────────────────────────────────────
  if (ai.userScheduleDescription.length > 500) {
    return NextResponse.json<ApiError>(
      {
        error:
          "Schedule description is too long. Please keep it under 500 characters.",
      },
      { status: 400 }
    );
  }

  // ── Check API key ──────────────────────────────────────────────────────
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[AniPace] GEMINI_API_KEY is not set");
    return NextResponse.json<ApiError>(
      { error: "AI Mode is not configured on this server. Please try Simple Mode." },
      { status: 500 }
    );
  }

  // ── Build prompt ───────────────────────────────────────────────────────
  const start = parseISODate(startDate);
  const target = parseISODate(targetDate);
  const daysAvailable = Math.max(
    1,
    Math.round((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );
  const weeksAvailable = Math.max(1, daysAvailable / 7);
  const weeklyTarget = (totalEpisodes / weeksAvailable).toFixed(1);
  const epDuration = episodeDuration ?? 24;
  // ~2.5 hours max per day
  const maxEpsPerDay = Math.min(10, Math.max(1, Math.ceil(150 / epDuration)));

  const prompt = `You are a scheduling assistant for an anime watching app.

The user wants to watch "${animeTitle}" — ${totalEpisodes} episodes, ${epDuration} minutes each.
Watching window: ${startDate} to ${targetDate} (${daysAvailable} days available).
To finish on time they need approximately ${weeklyTarget} episodes per week.

The user's weekly schedule: "${ai.userScheduleDescription}"

Based on the user's typical week, decide how many episodes they should watch on each day of the week.

Rules:
- Never assign more than ${maxEpsPerDay} episodes on a single day (~2.5 hours max)
- Days described as busy, hectic, or unavailable → assign 0
- Free evenings (~1-2 hrs available) → assign 1-2 episodes
- Open or free days → assign 2-${maxEpsPerDay} episodes
- Include at least 2-3 rest days per week (0 episodes) — everyone needs rest
- The total per week should be close to ${weeklyTarget} episodes

Return ONLY this valid JSON object — no markdown fences, no explanation, nothing else:
{"monday":0,"tuesday":0,"wednesday":0,"thursday":0,"friday":0,"saturday":0,"sunday":0}`;

  // ── Call Gemini ────────────────────────────────────────────────────────
  try {
    const genAI = new GoogleGenAI({ apiKey });
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });

    let rawText = response.text ?? "";

    // Strip markdown fences as a safety fallback
    rawText = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();

    // ── Parse day pattern ────────────────────────────────────────────────
    let parsedPattern: Record<string, unknown>;
    try {
      parsedPattern = JSON.parse(rawText) as Record<string, unknown>;
    } catch {
      console.error("[AniPace] Gemini returned non-JSON:", rawText);
      return NextResponse.json<ApiError>(
        {
          error:
            "AI couldn't produce a valid schedule. Please try again or use Simple Mode.",
          details: "Model returned non-JSON",
        },
        { status: 502 }
      );
    }

    // Coerce into DayPattern, clamp values to [0, maxEpsPerDay]
    const dayPattern: DayPattern = {
      sunday: 0,
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
    };

    const validKeys: DayKey[] = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];

    for (const key of validKeys) {
      const raw = parsedPattern[key];
      const n =
        typeof raw === "number" ? raw : parseInt(String(raw ?? "0"), 10);
      dayPattern[key] = Math.max(0, Math.min(maxEpsPerDay, isNaN(n) ? 0 : n));
    }

    // Guard: if all zeros, the pattern is unusable
    const totalPerWeek = Object.values(dayPattern).reduce((a, b) => a + b, 0);
    if (totalPerWeek === 0) {
      return NextResponse.json<ApiError>(
        {
          error:
            "AI couldn't find any free time based on your description. Try being more specific, or use Simple Mode.",
        },
        { status: 422 }
      );
    }

    // ── Generate schedule from pattern ───────────────────────────────────
    const { weeks, summary } = generateFromDayPattern(
      totalEpisodes,
      epDuration,
      startDate,
      dayPattern
    );

    return NextResponse.json<GenerateScheduleApiResponse>({ weeks, summary });
  } catch (err: unknown) {
    console.error("[AniPace] Gemini API error:", err);

    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
      return NextResponse.json<ApiError>(
        {
          error:
            "AI quota exceeded. Please try again in a moment, or use Simple Mode.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json<ApiError>(
      { error: "AI schedule generation failed. Please try Simple Mode." },
      { status: 500 }
    );
  }
}
