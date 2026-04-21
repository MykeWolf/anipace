import { toggleDayComplete, savePlan, loadPlans } from "@/lib/localStorage";
import type { SavedPlan } from "@/types";

const basePlan: SavedPlan = {
  id: "plan-test-1",
  animeTitle: "Attack on Titan",
  animeMalId: 16498,
  coverImage: "https://example.com/cover.jpg",
  totalEpisodes: 25,
  episodeDuration: 24,
  startDate: "2026-04-20",
  createdAt: "2026-04-20T00:00:00.000Z",
  weeks: [
    {
      weekNumber: 1,
      days: [
        {
          date: "2026-04-20",
          dayOfWeek: "Monday",
          episodes: { from: 1, to: 3 },
          estimatedMinutes: 72,
        },
        {
          date: "2026-04-21",
          dayOfWeek: "Tuesday",
          episodes: { from: 4, to: 6 },
          estimatedMinutes: 72,
        },
        {
          date: "2026-04-22",
          dayOfWeek: "Wednesday",
          episodes: null,
          estimatedMinutes: 0,
        },
      ],
    },
  ],
  summary: {
    totalWeeks: 1,
    episodesPerWeekAvg: 6,
    totalWatchHours: 2.4,
    projectedFinishDate: "2026-04-26",
  },
};

beforeEach(() => {
  localStorage.clear();
  savePlan({ ...basePlan });
});

describe("toggleDayComplete", () => {
  test("adds date to completedDays when not present", () => {
    toggleDayComplete(basePlan.id, "2026-04-20");
    const [plan] = loadPlans();
    expect(plan.completedDays).toContain("2026-04-20");
  });

  test("removes date from completedDays when already present (unchecking)", () => {
    toggleDayComplete(basePlan.id, "2026-04-20");
    toggleDayComplete(basePlan.id, "2026-04-20");
    const [plan] = loadPlans();
    expect(plan.completedDays).not.toContain("2026-04-20");
  });

  test("0% with no completions — completedDays is empty", () => {
    const [plan] = loadPlans();
    expect(plan.completedDays ?? []).toHaveLength(0);
  });

  test("progress reaches 100% when all episode days are toggled", () => {
    toggleDayComplete(basePlan.id, "2026-04-20");
    toggleDayComplete(basePlan.id, "2026-04-21");
    const [plan] = loadPlans();
    const episodeDays = plan.weeks
      .flatMap((w) => w.days)
      .filter((d) => d.episodes !== null);
    const completed = plan.completedDays ?? [];
    expect(completed).toHaveLength(episodeDays.length);
  });

  test("preserves checked state across simulated refresh (re-load from storage)", () => {
    toggleDayComplete(basePlan.id, "2026-04-21");
    // Simulate refresh: re-read from localStorage
    const plans = loadPlans();
    expect(plans[0].completedDays).toContain("2026-04-21");
  });

  test("returns false for an unknown plan id", () => {
    const result = toggleDayComplete("nonexistent-id", "2026-04-20");
    expect(result).toBe(false);
  });

  test("multiple dates tracked independently", () => {
    toggleDayComplete(basePlan.id, "2026-04-20");
    toggleDayComplete(basePlan.id, "2026-04-21");
    const [plan] = loadPlans();
    expect(plan.completedDays).toContain("2026-04-20");
    expect(plan.completedDays).toContain("2026-04-21");
  });
});
