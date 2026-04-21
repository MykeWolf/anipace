"use client";

/**
 * SavedPlansSection
 *
 * PRD "Saved Plans View":
 *   - List of saved plans as anime cover art cards (vertical stack on mobile)
 *   - Each card: cover image as background, gradient overlay, title + finish date
 *   - Delete icon (×) in top-right corner of each card
 *   - Tapping a card opens the full ScheduleDisplay for that plan
 *   - Empty state: "No plans yet" with a CTA to the planner
 *
 * Syncs with PlannerSection via custom window events:
 *   - Listens for  "anipace:saved"        → reload plans list (plan was saved)
 *   - Dispatches  "anipace:plan-deleted"  → tell PlannerSection a plan was removed
 *   - Also listens to "storage" for cross-tab sync
 */

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import type { SavedPlan } from "@/types";
import { loadUserPlans, saveUserPlan, deleteUserPlan } from "@/lib/planStorage";
import ScheduleDisplay from "@/components/planner/ScheduleDisplay";

// ── Date helper ───────────────────────────────────────────────────────────────

function shortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Plan Card ─────────────────────────────────────────────────────────────────

interface CardProps {
  plan: SavedPlan;
  onView: () => void;
  onDelete: () => void;
}

function PlanCard({ plan, onView, onDelete }: CardProps) {
  return (
    <div
      className="relative w-full rounded-[16px] overflow-hidden cursor-pointer select-none"
      style={{ height: 200 }}
      onClick={onView}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onView()}
      aria-label={`View ${plan.animeTitle} schedule`}
    >
      {/* Cover art */}
      <Image
        src={plan.coverImage}
        alt={plan.animeTitle}
        fill
        sizes="480px"
        className="object-cover object-top"
        priority={false}
      />

      {/* Gradient — transparent at top, near-black at bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />

      {/* Delete (×) button — top-right */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="
          absolute top-3 right-3 z-10
          w-7 h-7 rounded-full
          bg-black/60 backdrop-blur-sm
          flex items-center justify-center
          text-white/70 hover:text-white hover:bg-black/80
          transition-all text-[0.8125rem] font-semibold
        "
        aria-label={`Delete ${plan.animeTitle} plan`}
      >
        ✕
      </button>

      {/* Title + metadata — bottom-left */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-white font-bold text-[1rem] leading-snug line-clamp-1">
          {plan.animeTitle}
        </p>
        <p className="text-white/65 text-[0.8125rem] mt-0.5">
          {plan.totalEpisodes} eps &nbsp;·&nbsp; Finish{" "}
          {shortDate(plan.summary.projectedFinishDate)}
        </p>
      </div>
    </div>
  );
}

// ── Back arrow icon ───────────────────────────────────────────────────────────

function BackArrow() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="flex-shrink-0"
    >
      <path
        d="M10 12L6 8l4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SavedPlansSection() {
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [viewing, setViewing] = useState<SavedPlan | null>(null);

  const refresh = useCallback(() => {
    loadUserPlans().then(setPlans);
  }, []);

  useEffect(() => {
    refresh();
    // Refresh when PlannerSection saves a plan
    window.addEventListener("anipace:saved", refresh);
    // Refresh on cross-tab localStorage changes
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("anipace:saved", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  function handleProgressChange(updatedPlan: SavedPlan) {
    saveUserPlan(updatedPlan);
    setViewing(updatedPlan);
    setPlans((prev) =>
      prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p))
    );
  }

  function handleDelete(plan: SavedPlan) {
    deleteUserPlan(plan.id);
    setPlans((prev) => prev.filter((p) => p.id !== plan.id));
    if (viewing?.id === plan.id) setViewing(null);
    // Notify PlannerSection so it can clear its isSaved flag
    window.dispatchEvent(
      new CustomEvent("anipace:plan-deleted", { detail: { id: plan.id } })
    );
  }

  // ── Detail view (tapped a card) ────────────────────────────────────────────

  if (viewing) {
    return (
      <section
        id="saved-plans"
        className="w-full border-t border-border"
        aria-label="Saved plan detail"
      >
        {/* Back breadcrumb */}
        <div className="px-6 pt-10 pb-1">
          <button
            onClick={() => setViewing(null)}
            className="
              flex items-center gap-1.5
              text-[0.875rem] text-foreground-muted
              hover:text-foreground transition-colors
            "
          >
            <BackArrow />
            Saved Plans
          </button>
        </div>

        {/* Plan title */}
        <div className="px-6 pt-3 pb-2">
          <h2 className="text-[1.25rem] font-bold text-foreground leading-snug">
            {viewing.animeTitle}
          </h2>
          <p className="text-[0.875rem] text-foreground-muted mt-0.5">
            {viewing.totalEpisodes} episodes
          </p>
        </div>

        {/* Full schedule */}
        <ScheduleDisplay
          plan={viewing}
          isSaved={true}
          onSave={() => false}
          onDelete={() => handleDelete(viewing)}
          onStartOver={() => setViewing(null)}
          onProgressChange={handleProgressChange}
        />
      </section>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────

  return (
    <section
      id="saved-plans"
      className="w-full border-t border-border"
      aria-label="Saved plans"
    >
      {/* Header */}
      <div className="px-6 pt-14 pb-7">
        <h2 className="text-[1.125rem] font-bold text-foreground tracking-tight">
          Saved Plans
        </h2>
        <p className="text-[0.875rem] text-foreground-muted mt-1">
          {plans.length > 0
            ? `${plans.length} plan${plans.length === 1 ? "" : "s"} saved.`
            : "Your saved schedules will appear here."}
        </p>
      </div>

      {plans.length === 0 ? (
        // ── Empty state ──────────────────────────────────────────────────────
        <div className="px-6 pb-16 flex flex-col items-center gap-5 text-center">
          <div>
            <p className="text-[0.9375rem] text-foreground-muted font-medium">
              No plans yet
            </p>
            <p className="text-[0.8125rem] text-foreground-muted/60 mt-1 max-w-[240px] mx-auto leading-relaxed">
              Generate a schedule above and save it — it&apos;ll show up here.
            </p>
          </div>
          <button
            onClick={() => document.getElementById("planner")?.scrollIntoView({ behavior: "smooth" })}
            className="
              rounded-full border border-border
              px-6 py-3
              text-[0.875rem] font-semibold text-foreground-muted
              hover:text-foreground hover:border-foreground-muted
              transition-colors
            "
          >
            Plan Your Watch
          </button>
        </div>
      ) : (
        // ── Plan cards ───────────────────────────────────────────────────────
        <div className="px-6 pb-14 grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onView={() => setViewing(plan)}
              onDelete={() => handleDelete(plan)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
