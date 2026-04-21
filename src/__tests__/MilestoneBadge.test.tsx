import { render, screen } from "@testing-library/react";
import MilestoneBadge from "@/components/planner/MilestoneBadge";
import type { MilestoneBadge as MilestoneBadgeType, SavedPlan } from "@/types";

const plan: SavedPlan = {
  id: "plan-1",
  animeTitle: "Fullmetal Alchemist: Brotherhood",
  animeMalId: 5114,
  coverImage: "https://example.com/fmab.jpg",
  totalEpisodes: 64,
  episodeDuration: 24,
  startDate: "2026-04-20",
  createdAt: "2026-04-20T00:00:00.000Z",
  weeks: [],
  summary: {
    totalWeeks: 8,
    episodesPerWeekAvg: 8,
    totalWatchHours: 25.6,
    projectedFinishDate: "2026-06-14",
  },
};

function makeBadge(milestone: MilestoneBadgeType["milestone"], episodesWatched: number): MilestoneBadgeType {
  return { milestone, earnedAt: "2026-04-21T00:00:00.000Z", episodesWatched };
}

describe("MilestoneBadge component", () => {
  test("renders 25% milestone correctly", () => {
    render(<MilestoneBadge badge={makeBadge(25, 16)} plan={plan} />);
    expect(screen.getByText("25%")).toBeInTheDocument();
  });

  test("renders 50% milestone correctly", () => {
    render(<MilestoneBadge badge={makeBadge(50, 32)} plan={plan} />);
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  test("renders 75% milestone correctly", () => {
    render(<MilestoneBadge badge={makeBadge(75, 48)} plan={plan} />);
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  test("renders 100% milestone correctly", () => {
    render(<MilestoneBadge badge={makeBadge(100, 64)} plan={plan} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  test("shows anime title", () => {
    render(<MilestoneBadge badge={makeBadge(25, 16)} plan={plan} />);
    expect(screen.getByText("Fullmetal Alchemist: Brotherhood")).toBeInTheDocument();
  });

  test("shows episodes watched out of total", () => {
    render(<MilestoneBadge badge={makeBadge(50, 32)} plan={plan} />);
    expect(screen.getByText("32 of 64 episodes complete")).toBeInTheDocument();
  });

  test("shows AniPace watermark", () => {
    render(<MilestoneBadge badge={makeBadge(25, 16)} plan={plan} />);
    expect(screen.getByText("AniPace")).toBeInTheDocument();
  });

  test("cover image has correct src", () => {
    render(<MilestoneBadge badge={makeBadge(25, 16)} plan={plan} />);
    const img = screen.getByAltText("Fullmetal Alchemist: Brotherhood");
    expect(img).toHaveAttribute("src", "https://example.com/fmab.jpg");
  });
});
