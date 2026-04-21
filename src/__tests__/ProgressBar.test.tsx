import { render, screen } from "@testing-library/react";
import ProgressBar from "@/components/planner/ProgressBar";

describe("ProgressBar", () => {
  test("renders episode count and percentage", () => {
    render(
      <ProgressBar
        completedCount={2}
        totalEpisodeDays={10}
        episodesWatched={5}
        totalEpisodes={25}
      />
    );
    expect(screen.getByText(/Episode 5 of 25/)).toBeInTheDocument();
    expect(screen.getByText(/20%/)).toBeInTheDocument();
  });

  test("shows 0% with no completions", () => {
    render(
      <ProgressBar
        completedCount={0}
        totalEpisodeDays={10}
        episodesWatched={0}
        totalEpisodes={24}
      />
    );
    expect(screen.getByText(/Episode 0 of 24/)).toBeInTheDocument();
    expect(screen.getByText(/0%/)).toBeInTheDocument();
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveStyle({ width: "0%" });
  });

  test("shows 100% when all episodes complete", () => {
    render(
      <ProgressBar
        completedCount={10}
        totalEpisodeDays={10}
        episodesWatched={24}
        totalEpisodes={24}
      />
    );
    expect(screen.getByText(/Episode 24 of 24/)).toBeInTheDocument();
    expect(screen.getByText(/100%/)).toBeInTheDocument();
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveStyle({ width: "100%" });
  });

  test("progress bar width reflects percentage", () => {
    render(
      <ProgressBar
        completedCount={1}
        totalEpisodeDays={4}
        episodesWatched={6}
        totalEpisodes={25}
      />
    );
    const bar = screen.getByRole("progressbar");
    // 6/25 = 24%
    expect(bar).toHaveStyle({ width: "24%" });
  });

  test("shows days completed count", () => {
    render(
      <ProgressBar
        completedCount={3}
        totalEpisodeDays={10}
        episodesWatched={9}
        totalEpisodes={25}
      />
    );
    expect(screen.getByText("3/10 days")).toBeInTheDocument();
  });

  test("handles zero totalEpisodes without crashing (shows 0%)", () => {
    render(
      <ProgressBar
        completedCount={0}
        totalEpisodeDays={0}
        episodesWatched={0}
        totalEpisodes={0}
      />
    );
    expect(screen.getByText(/0%/)).toBeInTheDocument();
  });
});
