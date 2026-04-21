import { getNewlyEarnedMilestones, type Milestone } from "@/lib/milestones";
import { savePlan, loadPlans } from "@/lib/localStorage";
import type { SavedPlan, MilestoneBadge } from "@/types";

// ── Milestone detection unit tests ────────────────────────────────────────────

describe("getNewlyEarnedMilestones", () => {
  test("earns 25% milestone when crossing exactly 25", () => {
    const result = getNewlyEarnedMilestones(24, 25, new Set());
    expect(result).toContain(25);
  });

  test("earns 50% milestone when crossing exactly 50", () => {
    const result = getNewlyEarnedMilestones(49, 50, new Set());
    expect(result).toContain(50);
  });

  test("earns 75% milestone when crossing exactly 75", () => {
    const result = getNewlyEarnedMilestones(74, 75, new Set());
    expect(result).toContain(75);
  });

  test("earns 100% milestone when crossing exactly 100", () => {
    const result = getNewlyEarnedMilestones(99, 100, new Set());
    expect(result).toContain(100);
  });

  test("no badge earned below 25%", () => {
    const result = getNewlyEarnedMilestones(0, 24, new Set());
    expect(result).toHaveLength(0);
  });

  test("no badge earned at exactly 0%", () => {
    const result = getNewlyEarnedMilestones(0, 0, new Set());
    expect(result).toHaveLength(0);
  });

  test("badge does not re-trigger when already earned (idempotent)", () => {
    const alreadyEarned = new Set<Milestone>([25]);
    const result = getNewlyEarnedMilestones(24, 30, alreadyEarned);
    expect(result).not.toContain(25);
    expect(result).toHaveLength(0);
  });

  test("multiple milestones earned in one jump (e.g. 0 → 100)", () => {
    const result = getNewlyEarnedMilestones(0, 100, new Set());
    expect(result).toEqual([25, 50, 75, 100]);
  });

  test("only uneearned milestones in a jump are returned", () => {
    const alreadyEarned = new Set<Milestone>([25, 50]);
    const result = getNewlyEarnedMilestones(0, 100, alreadyEarned);
    expect(result).toEqual([75, 100]);
  });
});

// ── Persistence: earnedBadges survive localStorage round-trip ─────────────────

const basePlan: SavedPlan = {
  id: "plan-badge-test",
  animeTitle: "Fullmetal Alchemist",
  animeMalId: 121,
  coverImage: "https://example.com/fma.jpg",
  totalEpisodes: 51,
  episodeDuration: 24,
  startDate: "2026-04-20",
  createdAt: "2026-04-20T00:00:00.000Z",
  weeks: [],
  summary: {
    totalWeeks: 6,
    episodesPerWeekAvg: 8.5,
    totalWatchHours: 20.4,
    projectedFinishDate: "2026-06-01",
  },
};

const earnedBadge: MilestoneBadge = {
  milestone: 25,
  earnedAt: "2026-04-21T10:00:00.000Z",
  episodesWatched: 13,
};

beforeEach(() => {
  localStorage.clear();
});

describe("earnedBadges persistence", () => {
  test("earned badges persist in localStorage after savePlan", () => {
    savePlan({ ...basePlan, earnedBadges: [earnedBadge] });
    const [loaded] = loadPlans();
    expect(loaded.earnedBadges).toHaveLength(1);
    expect(loaded.earnedBadges![0].milestone).toBe(25);
  });

  test("earnedAt timestamp is preserved", () => {
    savePlan({ ...basePlan, earnedBadges: [earnedBadge] });
    const [loaded] = loadPlans();
    expect(loaded.earnedBadges![0].earnedAt).toBe("2026-04-21T10:00:00.000Z");
  });

  test("episodesWatched is preserved on badge", () => {
    savePlan({ ...basePlan, earnedBadges: [earnedBadge] });
    const [loaded] = loadPlans();
    expect(loaded.earnedBadges![0].episodesWatched).toBe(13);
  });

  test("multiple badges persist in order", () => {
    const badges: MilestoneBadge[] = [
      { milestone: 25, earnedAt: "2026-04-21T10:00:00.000Z", episodesWatched: 13 },
      { milestone: 50, earnedAt: "2026-04-22T10:00:00.000Z", episodesWatched: 26 },
    ];
    savePlan({ ...basePlan, earnedBadges: badges });
    const [loaded] = loadPlans();
    expect(loaded.earnedBadges).toHaveLength(2);
    expect(loaded.earnedBadges![0].milestone).toBe(25);
    expect(loaded.earnedBadges![1].milestone).toBe(50);
  });

  test("plan with no earnedBadges loads with undefined", () => {
    savePlan({ ...basePlan });
    const [loaded] = loadPlans();
    expect(loaded.earnedBadges).toBeUndefined();
  });
});
