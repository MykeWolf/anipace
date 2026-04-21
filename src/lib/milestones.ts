export const MILESTONES = [25, 50, 75, 100] as const;
export type Milestone = (typeof MILESTONES)[number];

/**
 * Returns milestones newly crossed when progress moves from oldPct to newPct,
 * excluding any already earned.
 */
export function getNewlyEarnedMilestones(
  oldPct: number,
  newPct: number,
  alreadyEarned: Set<Milestone>
): Milestone[] {
  return MILESTONES.filter(
    (m) => newPct >= m && oldPct < m && !alreadyEarned.has(m)
  );
}
