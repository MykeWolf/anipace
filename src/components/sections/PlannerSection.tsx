"use client";

/**
 * PlannerSection
 *
 * The orchestrator for the full planner flow. This is the top-level client
 * component for the #planner section. It owns the shared state that flows
 * between sub-components:
 *
 *   AnimeSearch  →  onSelect  →  selectedAnime (state)
 *                               ↓
 *                         AnimeDetailBanner  (cover art + metadata)
 *                               ↓
 *                         PlanningControls  (mode toggle, date, eps inputs)
 *                               ↓  onGenerate
 *                         ScheduleDisplay   (summary stats + week rows)
 *
 * Flow:
 *   1. User searches → selects anime → banner + planning controls appear
 *   2. User sets date + eps/day → clicks "Generate Plan" → schedule appears
 *   3. User clicks "Save Plan" → plan saved to localStorage
 *   4. User clicks "Start Over" → schedule clears, planning controls reappear
 *   5. User clicks "Delete Plan" → plan removed from localStorage
 */

import { useState, useEffect } from "react";
import type { AnimeDetailApiResponse, SavedPlan } from "@/types";
import AnimeSearch from "@/components/search/AnimeSearch";
import AnimeDetailBanner from "@/components/search/AnimeDetailBanner";
import PlanningControls from "@/components/planner/PlanningControls";
import ScheduleDisplay from "@/components/planner/ScheduleDisplay";
import { saveUserPlan, deleteUserPlan } from "@/lib/planStorage";
import MountedOnly from "@/components/shared/MountedOnly";


export default function PlannerSection() {
  const [selectedAnime, setSelectedAnime] =
    useState<AnimeDetailApiResponse | null>(null);
  const [manualEpisodes, setManualEpisodes] = useState("");
  const [generatedPlan, setGeneratedPlan] = useState<SavedPlan | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // ── Sync with SavedPlansSection ──────────────────────────────────────────────
  // If the user deletes the current plan from the SavedPlansSection, clear
  // the isSaved flag here so the "Save Plan" button reappears.
  useEffect(() => {
    function onExternalDelete(e: Event) {
      const id = (e as CustomEvent<{ id: string }>).detail?.id;
      if (id && generatedPlan?.id === id) {
        setIsSaved(false);
      }
    }
    window.addEventListener("anipace:plan-deleted", onExternalDelete);
    return () =>
      window.removeEventListener("anipace:plan-deleted", onExternalDelete);
  }, [generatedPlan]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleSelect(anime: AnimeDetailApiResponse) {
    setSelectedAnime(anime);
    setManualEpisodes("");
    setGeneratedPlan(null);
    setIsSaved(false);
  }

  function handleClear() {
    setSelectedAnime(null);
    setManualEpisodes("");
    setGeneratedPlan(null);
    setIsSaved(false);
  }

  function handleGenerate(plan: SavedPlan) {
    setGeneratedPlan(plan);
    setIsSaved(false);
  }

  async function handleSave(): Promise<boolean> {
    if (!generatedPlan) return false;
    const ok = await saveUserPlan(generatedPlan);
    if (ok) {
      setIsSaved(true);
      window.dispatchEvent(new CustomEvent("anipace:saved"));
    }
    return ok;
  }

  async function handleDelete() {
    if (!generatedPlan) return;
    await deleteUserPlan(generatedPlan.id);
    setIsSaved(false);
    window.dispatchEvent(new CustomEvent("anipace:saved"));
  }

  function handleProgressChange(updatedPlan: SavedPlan) {
    setGeneratedPlan(updatedPlan);
    if (isSaved) saveUserPlan(updatedPlan);
  }

  function handleStartOver() {
    setGeneratedPlan(null);
    setIsSaved(false);
    // Keep selectedAnime so user can tweak inputs and regenerate
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <section
      id="planner"
      className="w-full border-t border-border"
      aria-label="Plan your watch"
    >
      {/* Section heading */}
      <div className="px-6 pt-14 pb-7">
        <h2 className="text-[1.125rem] font-bold text-foreground tracking-tight">
          Plan your watch
        </h2>
        <p className="text-[0.875rem] text-foreground-muted mt-1">
          {selectedAnime
            ? "Set your pace and target date below."
            : "Search for an anime to get started."}
        </p>
      </div>

      {/* 1. Search input — always visible */}
      <AnimeSearch onSelect={handleSelect} onClear={handleClear} />

      {/* 2. Cover art banner — appears after anime is selected */}
      {selectedAnime && (
        <AnimeDetailBanner
          anime={selectedAnime}
          manualEpisodes={manualEpisodes}
          onManualEpisodesChange={setManualEpisodes}
        />
      )}

      {/* 3. Planning controls — visible when anime selected, no schedule yet */}
      {selectedAnime && !generatedPlan && (
        <PlanningControls
          anime={selectedAnime}
          manualEpisodes={manualEpisodes}
          onGenerate={handleGenerate}
        />
      )}

      {/* 4. Schedule display — visible after plan is generated */}
      {generatedPlan && (
        <MountedOnly>
          <ScheduleDisplay
            plan={generatedPlan}
            isSaved={isSaved}
            onSave={handleSave}
            onDelete={handleDelete}
            onStartOver={handleStartOver}
            onProgressChange={handleProgressChange}
          />
        </MountedOnly>
      )}
    </section>
  );
}
