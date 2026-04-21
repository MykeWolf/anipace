"use client";

import { useState } from "react";
import type { MilestoneBadge as MilestoneBadgeType, SavedPlan, ScheduleWeek } from "@/types";
import ProgressBar from "@/components/planner/ProgressBar";
import MilestoneBadge from "@/components/planner/MilestoneBadge";
import { toggleDayComplete } from "@/lib/localStorage";
import { getNewlyEarnedMilestones, type Milestone } from "@/lib/milestones";
import PlanDownloadButton from "@/components/pdf/PlanDownloadButton";
import Image from "next/image";
import confetti from "canvas-confetti";
import { formatShortDate, formatFullDate, formatDayDate, formatWeekRange } from "@/lib/dateUtils";

// ── Date / formatting helpers ─────────────────────────────────────────────────

function shortDate(iso: string): string {
  return formatShortDate(iso);
}

function fullDate(iso: string): string {
  return formatFullDate(iso);
}

function dayDate(iso: string): string {
  return formatDayDate(iso);
}

function weekDateRange(week: ScheduleWeek): string {
  if (week.days.length === 0) return "";
  return formatWeekRange(week.days[0].date, week.days[week.days.length - 1].date);
}

function weekEpRange(week: ScheduleWeek): { from: number; to: number } | null {
  const active = week.days.filter((d) => d.episodes !== null);
  if (active.length === 0) return null;
  return {
    from: active[0].episodes!.from,
    to: active[active.length - 1].episodes!.to,
  };
}

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
  onSave: () => boolean | Promise<boolean>;
  onDelete: () => void;
  onStartOver: () => void;
  onProgressChange?: (updatedPlan: SavedPlan) => void;
}

export default function ScheduleDisplay({
  plan,
  isSaved,
  onSave,
  onDelete,
  onStartOver,
  onProgressChange,
}: Props) {
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(
    () => new Set([1, 2])
  );
  const [saveError, setSaveError] = useState(false);
  const [pendingBadge, setPendingBadge] = useState<MilestoneBadgeType | null>(null);
  const [badgesOpen, setBadgesOpen] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const completedDays = plan.completedDays ?? [];

  // ── Progress calculations ────────────────────────────────────────────────────
  const allDays = plan.weeks.flatMap((w) => w.days);
  const episodeDays = allDays.filter((d) => d.episodes !== null);
  const totalEpisodeDays = episodeDays.length;

  function computeEpisodesWatched(completed: string[]): number {
    return episodeDays
      .filter((d) => completed.includes(d.date))
      .reduce((sum, d) => sum + (d.episodes!.to - d.episodes!.from + 1), 0);
  }

  const episodesWatched = computeEpisodesWatched(completedDays);
  const completedCount = episodeDays.filter((d) =>
    completedDays.includes(d.date)
  ).length;

  function toPct(watched: number): number {
    return plan.totalEpisodes > 0
      ? Math.round((watched / plan.totalEpisodes) * 100)
      : 0;
  }

  // ── Handlers ────────────────────────────────────────────────────────────────

  function toggleWeek(n: number) {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(n)) { next.delete(n); } else { next.add(n); }
      return next;
    });
  }

  async function handleSave() {
    setSaveError(false);
    const ok = await onSave();
    if (!ok) setSaveError(true);
  }

  function handleDayToggle(date: string) {
    toggleDayComplete(plan.id, date);
    const prev = plan.completedDays ?? [];
    const isAdding = !prev.includes(date);
    const newCompleted = isAdding
      ? [...prev, date]
      : prev.filter((d) => d !== date);

    const oldWatched = computeEpisodesWatched(prev);
    const newWatched = computeEpisodesWatched(newCompleted);
    const oldPct = toPct(oldWatched);
    const newPct = toPct(newWatched);

    const existingBadges = plan.earnedBadges ?? [];
    const alreadyEarned = new Set(existingBadges.map((b) => b.milestone as Milestone));
    const newMilestones = isAdding
      ? getNewlyEarnedMilestones(oldPct, newPct, alreadyEarned)
      : [];

    let updatedPlan: SavedPlan = { ...plan, completedDays: newCompleted };

    if (isAdding) {
      // Small confetti on every tick
      confetti({
        particleCount: 14,
        spread: 50,
        origin: { x: 0.5, y: 0.65 },
        colors: ["#8ab4f8", "#ffffff", "#a8c7fa"],
        scalar: 0.75,
        gravity: 1.4,
        drift: 0,
      });

      if (newMilestones.length > 0) {
        const newBadges: MilestoneBadgeType[] = newMilestones.map((m) => ({
          milestone: m,
          earnedAt: new Date().toISOString(),
          episodesWatched: newWatched,
        }));
        updatedPlan = {
          ...updatedPlan,
          earnedBadges: [...existingBadges, ...newBadges],
        };
        setPendingBadge(newBadges[newBadges.length - 1]);
        // Big burst on milestone
        confetti({
          particleCount: 140,
          spread: 90,
          origin: { x: 0.5, y: 0.4 },
          colors: ["#8ab4f8", "#ffffff", "#a8c7fa", "#c4d7f9", "#ffd700"],
          scalar: 1.1,
        });
      }
    } else {
      // Rollback badges that are above the new percentage
      updatedPlan = {
        ...updatedPlan,
        earnedBadges: existingBadges.filter((b) => newPct >= b.milestone),
      };
    }

    onProgressChange?.(updatedPlan);
  }

  const { summary } = plan;
  const isLate = !!plan.targetDate && summary.projectedFinishDate > plan.targetDate;
  const earnedBadges = plan.earnedBadges ?? [];

  return (
    <>
      {/* ── Milestone badge modal ─────────────────────────────────────────── */}
      {pendingBadge && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-black/85 px-6"
          onClick={() => setPendingBadge(null)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full">
            <p className="text-center text-white/70 text-[0.8125rem] mb-4 font-medium tracking-wide uppercase">
              Milestone unlocked
            </p>
            <MilestoneBadge badge={pendingBadge} plan={plan} />
            <button
              onClick={() => setPendingBadge(null)}
              className="
                mt-5 w-full max-w-[320px] mx-auto block
                rounded-full border border-white/20
                text-white/70 hover:text-white hover:border-white/40
                py-3 text-[0.875rem] font-semibold
                transition-colors
              "
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="w-full pb-12 overflow-hidden shadow-2xl bg-background rounded-b-[32px]">
        {/* ── 0. Hero Banner ─────────────────────────────────────────────── */}
        <div className="relative w-full aspect-[21/9] md:aspect-[21/7] overflow-hidden">
          {/* Ambient blurred background */}
          <div className="absolute inset-0 scale-110 blur-3xl opacity-50 grayscale-[0.5]">
            <Image
              src={plan.coverImage}
              alt=""
              fill
              className="object-cover"
              aria-hidden
            />
          </div>
          
          {/* Main image with vertical transition */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/40 to-transparent z-10" />
          
          <div className="relative z-20 h-full flex items-end px-6 pb-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-[2rem] md:text-[2.75rem] font-black text-foreground tracking-tight leading-[1.1] drop-shadow-sm max-w-[85%]">
                {plan.animeTitle}
              </h1>
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-foreground/10 text-foreground text-[0.75rem] font-bold uppercase tracking-wider">
                  {plan.totalEpisodes} Episodes
                </span>
                <span className="text-foreground-muted text-[0.875rem] font-medium">
                  {episodesWatched} of {plan.totalEpisodes} watched
                </span>
              </div>
            </div>
          </div>

          <div className="absolute inset-0 z-0">
             <Image
                src={plan.coverImage}
                alt={plan.animeTitle}
                fill
                className="object-cover opacity-80"
                priority
              />
          </div>
        </div>

        <div className="w-full mt-6">
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

        {/* ── Progress bar ──────────────────────────────────────────────── */}
        {totalEpisodeDays > 0 && (
          <ProgressBar
            completedCount={completedCount}
            totalEpisodeDays={totalEpisodeDays}
            episodesWatched={episodesWatched}
            totalEpisodes={plan.totalEpisodes}
          />
        )}

        {/* ── Summary stats ──────────────────────────────────────────────── */}
        <div className="mx-6 mb-5 rounded-[14px] bg-surface overflow-hidden border border-border/60">
          <div className="grid grid-cols-4 divide-x divide-border">
            {[
              { label: "Finish", value: shortDate(summary.projectedFinishDate) },
              { label: "Weeks", value: String(summary.totalWeeks) },
              { label: "Ep/week", value: summary.episodesPerWeekAvg.toFixed(1) },
              { label: "Hours", value: summary.totalWatchHours.toFixed(1) },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center py-4 px-1.5 gap-0.5">
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
                <button
                  onClick={() => toggleWeek(week.weekNumber)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-surface/60 transition-colors"
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

                {isOpen && (
                  <div className="divide-y divide-border/40 bg-background/40">
                    {week.days.map((day) => {
                      const isRest = day.episodes === null;
                      const isToday = day.date === today;
                      const isDone = completedDays.includes(day.date);

                      return (
                        <div
                          key={day.date}
                          className={[
                            "flex items-center px-6 py-3 gap-3 text-[0.8125rem]",
                            isRest ? "opacity-35" : "",
                            isToday ? "bg-accent/10 border-l-2 border-accent" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          {!isRest ? (
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={() => handleDayToggle(day.date)}
                              className="flex-shrink-0 w-4 h-4 accent-[var(--accent)] cursor-pointer"
                              aria-label={`Mark ${day.date} as watched`}
                            />
                          ) : (
                            <span className="flex-shrink-0 w-4 h-4" />
                          )}

                          <span className="w-[7rem] flex-shrink-0 text-foreground-muted">
                            {dayDate(day.date)}
                          </span>

                          <span
                            className={`flex-1 ${isRest ? "text-foreground-muted" : "text-foreground font-medium"} ${isDone ? "line-through opacity-50" : ""}`}
                          >
                            {isRest
                              ? "Rest"
                              : `Ep ${day.episodes!.from}–${day.episodes!.to}`}
                          </span>

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
          {!isSaved && (
            <button
              onClick={handleSave}
              className="w-full rounded-full bg-accent text-primary-foreground py-3.5 text-[0.9375rem] font-semibold hover:brightness-110 active:brightness-95 transition-all"
            >
              Save Plan
            </button>
          )}

          {isSaved && (
            <div className="w-full rounded-full bg-surface border border-border py-3.5 text-center">
              <span className="text-[0.9375rem] font-semibold text-accent">
                ✓ Plan saved
              </span>
            </div>
          )}

          {saveError && (
            <p className="text-[0.8125rem] text-destructive text-center">
              Couldn&apos;t save — storage may be full or unavailable.
            </p>
          )}

          <button
            onClick={onStartOver}
            className="w-full rounded-full border border-border text-foreground-muted py-3.5 text-[0.9375rem] font-semibold hover:text-foreground hover:border-foreground-muted transition-all"
          >
            Start Over
          </button>

          <PlanDownloadButton plan={plan} />

          {isSaved && (
            <button
              onClick={onDelete}
              className="w-full py-3 text-[0.875rem] text-destructive hover:text-destructive/75 transition-colors"
            >
              Delete Plan
            </button>
          )}
        </div>

        {/* ── View Badges ──────────────────────────────────────────────────── */}
        {earnedBadges.length > 0 && (
          <div className="px-6 pt-6">
            <button
              onClick={() => setBadgesOpen((prev) => !prev)}
              className="flex items-center gap-2 text-[0.875rem] text-foreground-muted hover:text-foreground transition-colors w-full"
            >
              <ChevronIcon open={badgesOpen} />
              <span className="font-semibold">
                View Badges ({earnedBadges.length})
              </span>
            </button>

            {badgesOpen && (
              <div className="mt-4 space-y-4">
                {earnedBadges.map((badge) => (
                  <MilestoneBadge key={badge.milestone} badge={badge} plan={plan} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  </>
);
}
