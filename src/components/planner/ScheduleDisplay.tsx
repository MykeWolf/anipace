"use client";

/**
 * ScheduleDisplay
 *
 * Renders a generated SavedPlan following the PRD "Schedule Display Layout":
 *
 *   1. Summary stats bar — Finish date · Weeks · Eps/week · Total hours
 *   2. Week-by-week collapsible list
 *      - First 2 weeks expanded by default; the rest collapsed
 *      - Week header: "Week 1 · Mar 4–10"  |  "Ep 1–14"
 *      - Day rows: day+date | episode range | watch time (dimmed for rest days)
 *   3. Action buttons — Save Plan (accent) · Start Over (outlined) · Delete Plan (red text, saved only)
 *
 * PRD notes:
 *   - "Days with no scheduled episodes show as dimmed/skipped"
 *   - "Use subtle divider lines (#2A2A2A) between days, not heavy borders"
 *   - "'Delete Plan' in red text (no background), only visible for saved plans"
 */

import { useState } from "react";
import type { SavedPlan, ScheduleWeek } from "@/types";

// ── Date / formatting helpers ─────────────────────────────────────────────────

function parseLocal(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "Mar 4" */
function shortDate(iso: string): string {
  return parseLocal(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** "March 22, 2026" */
function fullDate(iso: string): string {
  return parseLocal(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** "Mon, Mar 4" */
function dayDate(iso: string): string {
  return parseLocal(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** "Mar 10–16"  or  "Mar 28 – Apr 3" */
function weekDateRange(week: ScheduleWeek): string {
  if (week.days.length === 0) return "";
  const first = parseLocal(week.days[0].date);
  const last = parseLocal(week.days[week.days.length - 1].date);

  const fm = first.toLocaleDateString("en-US", { month: "short" });
  const lm = last.toLocaleDateString("en-US", { month: "short" });
  const fd = first.getDate();
  const ld = last.getDate();

  return fm === lm ? `${fm} ${fd}–${ld}` : `${fm} ${fd} – ${lm} ${ld}`;
}

/** Episode range covered in a week (first active day → last active day). */
function weekEpRange(
  week: ScheduleWeek
): { from: number; to: number } | null {
  const active = week.days.filter((d) => d.episodes !== null);
  if (active.length === 0) return null;
  return {
    from: active[0].episodes!.from,
    to: active[active.length - 1].episodes!.to,
  };
}

/** "48 min"  or  "1h 12m"  or  "2h" */
function fmtMinutes(m: number): string {
  if (m === 0) return "—";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

// ── Chevron icon ──────────────────────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      aria-hidden
      className={`flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path
        d="M3.5 5.5l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  plan: SavedPlan;
  isSaved: boolean;
  /** Return true if save succeeded. */
  onSave: () => boolean;
  onDelete: () => void;
  onStartOver: () => void;
}

export default function ScheduleDisplay({
  plan,
  isSaved,
  onSave,
  onDelete,
  onStartOver,
}: Props) {
  // Weeks 1 and 2 open by default (PRD: "collapsed by default after week 2")
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(
    () => new Set([1, 2])
  );
  const [saveError, setSaveError] = useState(false);

  function toggleWeek(n: number) {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      next.has(n) ? next.delete(n) : next.add(n);
      return next;
    });
  }

  function handleSave() {
    setSaveError(false);
    const ok = onSave();
    if (!ok) setSaveError(true);
  }

  const { summary } = plan;

  // Is the projected finish date later than the user's target?
  const isLate = summary.projectedFinishDate > plan.targetDate;

  return (
    <div className="w-full mt-2 pb-12">
      {/* ── Late-finish warning ─────────────────────────────────────────── */}
      {isLate && (
        <div className="mx-6 mb-4 rounded-[12px] bg-amber-500/10 border border-amber-500/25 px-4 py-3">
          <p className="text-[0.8125rem] text-amber-400 leading-snug">
            ⚠ At this pace you&apos;ll finish by{" "}
            <span className="font-semibold">
              {fullDate(summary.projectedFinishDate)}
            </span>
            , after your target. Increase your episodes/day to finish sooner.
          </p>
        </div>
      )}

      {/* ── Summary stats ──────────────────────────────────────────────── */}
      <div className="mx-6 mb-5 rounded-[14px] bg-surface overflow-hidden border border-border/60">
        <div className="grid grid-cols-4 divide-x divide-border">
          {[
            {
              label: "Finish",
              value: shortDate(summary.projectedFinishDate),
            },
            { label: "Weeks", value: String(summary.totalWeeks) },
            { label: "Ep/week", value: summary.episodesPerWeekAvg.toFixed(1) },
            { label: "Hours", value: summary.totalWatchHours.toFixed(1) },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex flex-col items-center py-4 px-1.5 gap-0.5"
            >
              <span className="text-[1rem] font-bold text-foreground leading-tight tabular-nums">
                {value}
              </span>
              <span className="text-[0.625rem] text-foreground-muted uppercase tracking-widest">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Week-by-week list ───────────────────────────────────────────── */}
      <div className="border-y border-border divide-y divide-border">
        {plan.weeks.map((week) => {
          const isOpen = expandedWeeks.has(week.weekNumber);
          const epRange = weekEpRange(week);
          const dateRange = weekDateRange(week);

          return (
            <div key={week.weekNumber}>
              {/* Week header (toggle button) */}
              <button
                onClick={() => toggleWeek(week.weekNumber)}
                aria-expanded={isOpen}
                className="
                  w-full flex items-center justify-between
                  px-6 py-4 text-left
                  hover:bg-surface/60 transition-colors
                "
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-foreground-muted">
                    <ChevronIcon open={isOpen} />
                  </span>
                  <span className="text-[0.9375rem] font-semibold text-foreground whitespace-nowrap">
                    Week {week.weekNumber}
                  </span>
                  <span className="text-[0.875rem] text-foreground-muted truncate">
                    · {dateRange}
                  </span>
                </div>

                {epRange && (
                  <span className="text-[0.8125rem] text-foreground-muted flex-shrink-0 ml-2">
                    Ep {epRange.from}–{epRange.to}
                  </span>
                )}
              </button>

              {/* Day rows */}
              {isOpen && (
                <div className="divide-y divide-border/40 bg-background/40">
                  {week.days.map((day) => {
                    const isRest = day.episodes === null;
                    return (
                      <div
                        key={day.date}
                        className={`
                          flex items-center px-6 py-3 gap-2
                          text-[0.8125rem]
                          ${isRest ? "opacity-35" : ""}
                        `}
                      >
                        {/* Day name + date */}
                        <span className="w-[7rem] flex-shrink-0 text-foreground-muted">
                          {dayDate(day.date)}
                        </span>

                        {/* Episode range */}
                        <span
                          className={`flex-1 ${isRest ? "text-foreground-muted" : "text-foreground font-medium"}`}
                        >
                          {isRest
                            ? "Rest"
                            : `Ep ${day.episodes!.from}–${day.episodes!.to}`}
                        </span>

                        {/* Watch time */}
                        <span className="text-foreground-muted text-right flex-shrink-0">
                          {fmtMinutes(day.estimatedMinutes)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Action buttons ──────────────────────────────────────────────── */}
      <div className="px-6 pt-8 space-y-3">
        {/* Save Plan — only shown when not yet saved */}
        {!isSaved && (
          <button
            onClick={handleSave}
            className="
              w-full rounded-full bg-accent text-primary-foreground
              py-3.5 text-[0.9375rem] font-semibold
              hover:brightness-110 active:brightness-95
              transition-all
            "
          >
            Save Plan
          </button>
        )}

        {/* Saved confirmation */}
        {isSaved && (
          <div className="w-full rounded-full bg-surface border border-border py-3.5 text-center">
            <span className="text-[0.9375rem] font-semibold text-accent">
              ✓ Plan saved
            </span>
          </div>
        )}

        {/* Save error */}
        {saveError && (
          <p className="text-[0.8125rem] text-destructive text-center">
            Couldn&apos;t save — storage may be full or unavailable.
          </p>
        )}

        {/* Start Over */}
        <button
          onClick={onStartOver}
          className="
            w-full rounded-full border border-border
            text-foreground-muted py-3.5
            text-[0.9375rem] font-semibold
            hover:text-foreground hover:border-foreground-muted
            transition-all
          "
        >
          Start Over
        </button>

        {/* Delete Plan — only for saved plans */}
        {isSaved && (
          <button
            onClick={onDelete}
            className="
              w-full py-3
              text-[0.875rem] text-destructive
              hover:text-destructive/75
              transition-colors
            "
          >
            Delete Plan
          </button>
        )}
      </div>
    </div>
  );
}
