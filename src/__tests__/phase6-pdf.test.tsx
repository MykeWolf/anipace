import React from "react";
import { render, screen } from "@testing-library/react";
import type { SavedPlan } from "@/types";

// ── Mocks ──────────────────────────────────────────────────────────────────────

jest.mock("@react-pdf/renderer", () => ({
  Document: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pdf-doc">{children}</div>
  ),
  Page: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pdf-page">{children}</div>
  ),
  Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  View: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  StyleSheet: { create: (s: unknown) => s },
  PDFDownloadLink: ({
    children,
    fileName,
  }: {
    children: (props: { loading: boolean }) => React.ReactNode;
    fileName: string;
  }) => (
    <a href="#" download={fileName} data-testid="pdf-link">
      {children({ loading: false })}
    </a>
  ),
}));

jest.mock("next/dynamic", () => () => {
  // Resolve the dynamic import synchronously in tests
  // PDFDownloadLink mock is already registered above
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("@react-pdf/renderer").PDFDownloadLink;
});

// ── Fixture ────────────────────────────────────────────────────────────────────

const mockPlan: SavedPlan = {
  id: "plan-001",
  animeTitle: "Fullmetal Alchemist: Brotherhood",
  animeMalId: 5114,
  coverImage: "https://example.com/fmab.jpg",
  totalEpisodes: 64,
  episodeDuration: 24,
  startDate: "2026-04-21",
  targetDate: "2026-10-01",
  createdAt: new Date().toISOString(),
  summary: {
    totalWeeks: 13,
    episodesPerWeekAvg: 5.0,
    totalWatchHours: 25.6,
    projectedFinishDate: "2026-07-21",
  },
  weeks: [
    {
      weekNumber: 1,
      days: [
        {
          date: "2026-04-21",
          dayOfWeek: "Tuesday",
          episodes: { from: 1, to: 5 },
          estimatedMinutes: 120,
        },
        {
          date: "2026-04-22",
          dayOfWeek: "Wednesday",
          episodes: null,
          estimatedMinutes: 0,
        },
      ],
    },
    {
      weekNumber: 2,
      days: [
        {
          date: "2026-04-28",
          dayOfWeek: "Monday",
          episodes: { from: 6, to: 10 },
          estimatedMinutes: 120,
        },
      ],
    },
  ],
};

// ── Tests: PlanPDF ─────────────────────────────────────────────────────────────

describe("PlanPDF", () => {
  // Import here so mocks are set up first
  let PlanPDF: React.ComponentType<{ plan: SavedPlan }>;
  beforeAll(async () => {
    PlanPDF = (await import("@/components/pdf/PlanPDF")).default;
  });

  test("renders the anime title", () => {
    render(<PlanPDF plan={mockPlan} />);
    expect(screen.getByText("Fullmetal Alchemist: Brotherhood")).toBeInTheDocument();
  });

  test("renders total episodes and date range", () => {
    render(<PlanPDF plan={mockPlan} />);
    expect(screen.getByText(/64 episodes/)).toBeInTheDocument();
  });

  test("renders stat labels", () => {
    render(<PlanPDF plan={mockPlan} />);
    expect(screen.getByText(/Weeks/i)).toBeInTheDocument();
    expect(screen.getByText(/Ep \/ week/i)).toBeInTheDocument();
    expect(screen.getByText(/Watch time/i)).toBeInTheDocument();
  });

  test("renders all week rows", () => {
    render(<PlanPDF plan={mockPlan} />);
    // Week column renders the week number only
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
  });

  test("renders episode ranges for weeks with episodes", () => {
    render(<PlanPDF plan={mockPlan} />);
    expect(screen.getByText(/Ep 1-5/)).toBeInTheDocument();
    expect(screen.getByText(/Ep 6-10/)).toBeInTheDocument();
  });
});

// ── Tests: PlanDownloadButton ──────────────────────────────────────────────────

describe("PlanDownloadButton", () => {
  let PlanDownloadButton: React.ComponentType<{ plan: SavedPlan }>;
  beforeAll(async () => {
    PlanDownloadButton = (await import("@/components/pdf/PlanDownloadButton")).default;
  });

  test("renders a Download PDF button", () => {
    render(<PlanDownloadButton plan={mockPlan} />);
    expect(screen.getByRole("button", { name: /download pdf/i })).toBeInTheDocument();
  });

  test("generates a kebab-case filename from the anime title", () => {
    render(<PlanDownloadButton plan={mockPlan} />);
    const link = screen.getByTestId("pdf-link");
    expect(link).toHaveAttribute(
      "download",
      expect.stringMatching(/fullmetal-alchemist.*plan\.pdf/i)
    );
  });
});
