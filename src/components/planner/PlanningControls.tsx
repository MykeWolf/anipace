"use client";

/**
 * PlanningControls
 *
 * Shown below AnimeDetailBanner once an anime is selected.
 * Collects the user's scheduling preferences and fires onGenerate.
 *
 * PRD (Planner Page Layout — Planning Controls):
 *   - Segmented control: Simple Mode | AI Mode
 *   - Simple Mode: "Episodes per weekday" + "Episodes per weekend day" number inputs
 *   - AI Mode: textarea for natural language schedule description
 *   - Target finish date picker (min = tomorrow, styled dark)
 *   - "Generate Plan" full-width pill button in accent blue
 *   - Loading state while AI processes ("Building your schedule…")
 *   - Warning message if projected finish > target date
 *
 * Edge cases handled:
 *   - Episode count unknown (ongoing): requires manualEpisodes to be set
 *   - weekdayEps + weekendEps = 0: blocked with error
 *   - Target date not set: blocked with error
 *   - AI Mode: empty description blocked; network/API errors surfaced
 */

import { useState } from "react";
import type {
  AnimeDetailApiResponse,
  SavedPlan,
  GenerateScheduleApiResponse,
  ApiError,
} from "@/types";
import { generateSimpleSchedule, formatISODate } from "@/lib/generateSchedule";
import MountedOnly from "@/components/shared/MountedOnly";

// ── Date helpers ──────────────────────────────────────────────────────────────

function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatISODate(d);
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <span
      role="status"
      aria-label="Loading"
      className="block flex-shrink-0 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin"
      style={{ width: 16, height: 16 }}
    />
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  anime: AnimeDetailApiResponse;
  /** Current manual episode count (for ongoing series with episodes === null). */
  manualEpisodes: string;
  /** Called with the completed plan after successful generation. */
  onGenerate: (plan: SavedPlan) => void;
}

type Mode = "simple" | "ai";

export default function PlanningControls({
  anime,
  manualEpisodes,
  onGenerate,
}: Props) {
  const [mode, setMode] = useState<Mode>("simple");
  const [targetDate, setTargetDate] = useState("");
  const [weekdayEps, setWeekdayEps] = useState("1");
  const [weekendEps, setWeekendEps] = useState("2");
  const [aiDescription, setAiDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The actual episode count, respecting manual override for ongoing series
  const effectiveEpisodes =
    anime.episodes !== null
      ? anime.episodes
      : parseInt(manualEpisodes) || 0;

  const minDate = getTomorrow();

  // ── Shared validation ─────────────────────────────────────────────────────

  function validateCommon(): boolean {
    setError(null);

    if (effectiveEpisodes < 1) {
      setError(
        anime.episodes === null
          ? "Enter the current episode count above before generating."
          : "This anime has no episode data — can't generate a plan."
      );
      return false;
    }

    if (targetDate && targetDate <= formatISODate(new Date())) {
      setError("Choose a future date — the target date must be at least tomorrow.");
      return false;
    }

    return true;
  }

  // ── Simple Mode ───────────────────────────────────────────────────────────

  function handleSimpleGenerate() {
    if (!validateCommon()) return;

    const wdEps = Math.max(0, parseInt(weekdayEps) || 0);
    const weEps = Math.max(0, parseInt(weekendEps) || 0);

    if (wdEps + weEps === 0) {
      setError("Set at least 1 episode per weekday or weekend day.");
      return;
    }

    const today = formatISODate(new Date());

    const plan = generateSimpleSchedule({
      animeTitle: anime.title_english ?? anime.title,
      animeMalId: anime.mal_id,
      coverImage: anime.coverImage,
      totalEpisodes: effectiveEpisodes,
      episodeDurationMinutes: anime.episodeDurationMinutes,
      startDate: today,
      targetDate,
      weekdayEps: wdEps,
      weekendEps: weEps,
    });

    // Note: late-finish warning is shown by ScheduleDisplay (compares
    // plan.summary.projectedFinishDate vs plan.targetDate at render time).
    onGenerate(plan);
  }

  // ── AI Mode ───────────────────────────────────────────────────────────────

  async function handleAIGenerate() {
    if (!validateCommon()) return;

    if (!aiDescription.trim()) {
      setError("Describe your weekly schedule so the AI can build around it.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    const today = formatISODate(new Date());

    try {
      const res = await fetch("/api/generate-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animeTitle: anime.title_english ?? anime.title,
          totalEpisodes: effectiveEpisodes,
          episodeDuration: anime.episodeDurationMinutes,
          startDate: today,
          targetDate,
          mode: "ai",
          ai: { userScheduleDescription: aiDescription.trim() },
        }),
      });

      if (!res.ok) {
        const errData = (await res.json()) as ApiError;
        setError(
          errData.error ??
            "Something went wrong generating your schedule. Try Simple Mode instead."
        );
        return;
      }

      const data = (await res.json()) as GenerateScheduleApiResponse;

      // Assemble the full SavedPlan — the route only returns weeks + summary,
      // so we attach the anime metadata here on the client.
      const plan: SavedPlan = {
        id: crypto.randomUUID(),
        animeTitle: anime.title_english ?? anime.title,
        animeMalId: anime.mal_id,
        coverImage: anime.coverImage,
        totalEpisodes: effectiveEpisodes,
        episodeDuration: anime.episodeDurationMinutes,
        startDate: today,
        targetDate,
        createdAt: new Date().toISOString(),
        weeks: data.weeks,
        summary: data.summary,
      };

      onGenerate(plan);
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  // ── Shared input class ────────────────────────────────────────────────────

  const inputCls = `
    w-full rounded-[12px] bg-surface-elevated
    px-4 py-3.5
    text-[0.9375rem] text-foreground placeholder:text-foreground-muted
    border border-border
    outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20
    transition-colors
  `;

  return (
    <MountedOnly>
      <div className="px-6 pt-7 pb-10 space-y-5 border-t border-border mt-5">
      {/* ── Mode toggle (segmented control) ───────────────────────────── */}
      <div
        className="flex rounded-full bg-surface p-1 gap-1"
        role="group"
        aria-label="Planning mode"
      >
        {(["simple", "ai"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            aria-pressed={mode === m}
            className={`
              flex-1 py-2.5 rounded-full
              text-[0.875rem] font-medium
              transition-all
              ${
                mode === m
                  ? "bg-accent text-primary-foreground shadow-sm"
                  : "text-foreground-muted hover:text-foreground"
              }
            `}
          >
            {m === "simple" ? "Simple Mode" : "AI Mode"}
          </button>
        ))}
      </div>

      {/* ── Target finish date ─────────────────────────────────────────── */}
      <div>
        <label className="block text-[0.8125rem] text-foreground-muted mb-1.5 font-medium">
          Target finish date{" "}
          <span className="text-foreground-muted/60 font-normal">(optional)</span>
        </label>
        <input
          type="date"
          value={targetDate}
          min={minDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className={inputCls}
          aria-label="Target finish date (optional)"
        />
        {!targetDate && (
          <p className="text-[0.75rem] text-foreground-muted/60 mt-1.5">
            Leave blank and we&apos;ll tell you when you&apos;ll finish at your pace.
          </p>
        )}
      </div>

      {/* ── Simple Mode inputs ─────────────────────────────────────────── */}
      {mode === "simple" && (
        <div className="grid grid-cols-2 gap-3">
          {/* Weekday */}
          <div>
            <label className="block text-[0.8125rem] text-foreground-muted mb-1.5 font-medium">
              Eps per weekday
            </label>
            <input
              type="number"
              min="0"
              max="99"
              value={weekdayEps}
              onChange={(e) => setWeekdayEps(e.target.value)}
              inputMode="numeric"
              aria-label="Episodes per weekday"
              className={`${inputCls} text-center`}
            />
          </div>

          {/* Weekend */}
          <div>
            <label className="block text-[0.8125rem] text-foreground-muted mb-1.5 font-medium">
              Eps per weekend day
            </label>
            <input
              type="number"
              min="0"
              max="99"
              value={weekendEps}
              onChange={(e) => setWeekendEps(e.target.value)}
              inputMode="numeric"
              aria-label="Episodes per weekend day"
              className={`${inputCls} text-center`}
            />
          </div>
        </div>
      )}

      {/* ── AI Mode textarea ───────────────────────────────────────────── */}
      {mode === "ai" && (
        <div>
          <label className="block text-[0.8125rem] text-foreground-muted mb-1.5 font-medium">
            Describe your typical week
          </label>
          <textarea
            value={aiDescription}
            onChange={(e) => setAiDescription(e.target.value)}
            placeholder="e.g. I work 9–5 weekdays, free after 8pm most evenings, weekends mostly open except Sunday mornings"
            rows={4}
            disabled={isGenerating}
            aria-label="Describe your weekly schedule"
            className={`${inputCls} resize-none leading-relaxed disabled:opacity-50`}
          />
        </div>
      )}

      {/* ── Validation / API error ─────────────────────────────────────── */}
      {error && (
        <p className="text-[0.8125rem] text-destructive leading-snug">{error}</p>
      )}

      {/* ── Generate Plan button ───────────────────────────────────────── */}
      <button
        onClick={mode === "simple" ? handleSimpleGenerate : handleAIGenerate}
        disabled={isGenerating}
        className="
          w-full rounded-full bg-accent text-primary-foreground
          py-3.5 text-[0.9375rem] font-semibold
          hover:brightness-110 active:brightness-95
          transition-all
          disabled:opacity-60 disabled:cursor-not-allowed
          flex items-center justify-center gap-2.5
        "
      >
        {isGenerating ? (
          <>
            <Spinner />
            Building your schedule…
          </>
        ) : (
          "Generate Plan"
        )}
      </button>
    </div>
    </MountedOnly>
  );
}
