/**
 * localStorage.ts
 *
 * Helpers for persisting and loading SavedPlan objects in the browser.
 * Storage key: "anipace_plans" (array of SavedPlan).
 *
 * All functions guard against:
 *   - localStorage unavailability (private browsing, quota exceeded)
 *   - Corrupt JSON (returns safe defaults, logs to console)
 */

import type { SavedPlan } from "@/types";

const STORAGE_KEY = "anipace_plans";

/** Returns true if localStorage is available and writable. */
function isAvailable(): boolean {
  try {
    const test = "__anipace_test__";
    localStorage.setItem(test, "1");
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/** Load all saved plans from localStorage. Returns [] on any failure. */
export function loadPlans(): SavedPlan[] {
  if (!isAvailable()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedPlan[];
  } catch (err) {
    console.warn("[AniPace] Failed to load plans from localStorage:", err);
    return [];
  }
}

/**
 * Upsert a plan.
 * If a plan with the same id already exists, it is replaced.
 * Returns true on success, false if storage is unavailable or full.
 */
export function savePlan(plan: SavedPlan): boolean {
  if (!isAvailable()) return false;
  try {
    const plans = loadPlans();
    const idx = plans.findIndex((p) => p.id === plan.id);
    if (idx >= 0) {
      plans[idx] = plan;
    } else {
      plans.push(plan);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    return true;
  } catch (err) {
    console.warn("[AniPace] Failed to save plan:", err);
    return false;
  }
}

/**
 * Remove a plan by id.
 * Returns true on success, false on failure.
 */
export function deletePlan(id: string): boolean {
  if (!isAvailable()) return false;
  try {
    const plans = loadPlans().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    return true;
  } catch (err) {
    console.warn("[AniPace] Failed to delete plan:", err);
    return false;
  }
}

/** Returns true if a plan with the given id is currently saved. */
export function isPlanSaved(id: string): boolean {
  return loadPlans().some((p) => p.id === id);
}
