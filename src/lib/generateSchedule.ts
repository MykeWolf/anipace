/**
 * generateSchedule.ts
 *
 * Pure client-side schedule generation for Simple Mode.
 * No API calls — all math is done in the browser.
 *
 * Algorithm:
 *   1. Start from today, iterate day by day
 *   2. Assign episodes based on weekday/weekend setting
 *   3. Rest days (0 eps allowed) are included as dimmed entries
 *   4. Group every 7 consecutive days into a ScheduleWeek
 *   5. Safety cap: 10 years (3650 days) to prevent infinite loops
 *
 * PRD reference (Simple Mode section):
 *   "Total episodes ÷ (weekday eps × 5 + weekend eps × 2) = weeks needed.
 *    Distribute across calendar dates from start to target.
 *    If the math doesn't fit the target date, show a message."
 */

import type {
  SavedPlan,
  ScheduleDay,
  ScheduleWeek,
  ScheduleSummary,
} from "@/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

type DayName =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

const DAY_NAMES: DayName[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * Format a Date object as "YYYY-MM-DD" using local time.
 * Avoids UTC offset issues that new Date("2026-03-04") can cause.
 */
export function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Parse an ISO date string ("YYYY-MM-DD") into a local-time Date.
 */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Generate a simple unique ID (good enough for localStorage keys). */
function generateId(): string {
  return crypto.randomUUID();
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface SimpleScheduleParams {
  animeTitle: string;
  animeMalId: number;
  coverImage: string;
  totalEpisodes: number;
  episodeDurationMinutes: number;
  /** ISO date string for the day watching starts (typically today). */
  startDate: string;
  /** ISO date string for the user's desired finish date. */
  targetDate: string;
  /** Episodes to watch on Mon–Fri. 0 = rest days. */
  weekdayEps: number;
  /** Episodes to watch on Sat–Sun. 0 = rest days. */
  weekendEps: number;
}

/**
 * Generate a Simple Mode schedule.
 *
 * Returns a complete SavedPlan (without the id already saved to localStorage —
 * the caller decides whether to persist it).
 *
 * Preconditions (caller must validate before calling):
 *   - totalEpisodes >= 1
 *   - weekdayEps + weekendEps > 0 (otherwise the loop never terminates)
 *   - startDate is a valid ISO date
 *   - targetDate >= startDate
 */
export function generateSimpleSchedule(
  params: SimpleScheduleParams
): SavedPlan {
  const {
    animeTitle,
    animeMalId,
    coverImage,
    totalEpisodes,
    episodeDurationMinutes,
    startDate,
    targetDate,
    weekdayEps,
    weekendEps,
  } = params;

  // Work in local time to avoid DST / UTC offset surprises
  const currentDate = parseISODate(startDate);

  let remainingEps = totalEpisodes;
  let currentEp = 1;
  const allDays: ScheduleDay[] = [];

  // 10-year safety cap (prevents infinite loop if both eps values are 0)
  const MAX_DAYS = 3650;

  while (remainingEps > 0 && allDays.length < MAX_DAYS) {
    const jsDay = currentDate.getDay(); // 0 = Sun … 6 = Sat
    const isWeekend = jsDay === 0 || jsDay === 6;
    const epsAllowed = isWeekend ? weekendEps : weekdayEps;

    // Never exceed remaining episodes on the last day
    const epsToday = Math.min(epsAllowed, remainingEps);

    allDays.push({
      date: formatISODate(currentDate),
      dayOfWeek: DAY_NAMES[jsDay],
      episodes:
        epsToday > 0
          ? { from: currentEp, to: currentEp + epsToday - 1 }
          : null, // rest day
      estimatedMinutes: epsToday * episodeDurationMinutes,
    });

    if (epsToday > 0) {
      currentEp += epsToday;
      remainingEps -= epsToday;
    }

    // Advance to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Group consecutive days into 7-day calendar weeks
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

  const summary: ScheduleSummary = {
    totalWeeks,
    episodesPerWeekAvg,
    totalWatchHours,
    projectedFinishDate,
  };

  return {
    id: generateId(),
    animeTitle,
    animeMalId,
    coverImage,
    totalEpisodes,
    episodeDuration: episodeDurationMinutes,
    startDate,
    targetDate,
    createdAt: new Date().toISOString(),
    weeks,
    summary,
  };
}
