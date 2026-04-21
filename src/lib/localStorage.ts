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
  if (typeof window === "undefined") return false;
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

/**
 * Toggle a day's completion status for a plan.
 * If the date is already in completedDays, it is removed; otherwise it is added.
 * Returns true on success, false if plan not found or storage unavailable.
 */
export function toggleDayComplete(planId: string, date: string): boolean {
  if (!isAvailable()) return false;
  try {
    const plans = loadPlans();
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return false;
    const completed = plan.completedDays ?? [];
    const idx = completed.indexOf(date);
    plan.completedDays =
      idx >= 0
        ? completed.filter((d) => d !== date)
        : [...completed, date];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    return true;
  } catch (err) {
    console.warn("[AniPace] Failed to toggle day complete:", err);
    return false;
  }
}
