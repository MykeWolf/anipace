// ─── Jikan API Types ─────────────────────────────────────────────────────────

export interface JikanAnimeImage {
  image_url: string;
  small_image_url: string;
  large_image_url: string;
}

export interface JikanAnimeSearchResult {
  mal_id: number;
  title: string;
  title_english: string | null;
  episodes: number | null; // null for ongoing series
  status: "Finished Airing" | "Currently Airing" | "Not yet aired";
  images: {
    jpg: JikanAnimeImage;
    webp: JikanAnimeImage;
  };
  synopsis: string | null;
  duration: string | null; // e.g. "24 min per ep"
  score: number | null;
  year: number | null;
}

// ─── Schedule / Plan Types ───────────────────────────────────────────────────

export interface ScheduleDay {
  date: string; // ISO date string: "2026-03-10"
  dayOfWeek:
    | "Monday"
    | "Tuesday"
    | "Wednesday"
    | "Thursday"
    | "Friday"
    | "Saturday"
    | "Sunday";
  episodes: { from: number; to: number } | null; // null = rest day
  estimatedMinutes: number;
}

export interface ScheduleWeek {
  weekNumber: number;
  days: ScheduleDay[];
}

export interface ScheduleSummary {
  totalWeeks: number;
  episodesPerWeekAvg: number;
  totalWatchHours: number;
  projectedFinishDate: string; // ISO date string
}

export interface MilestoneBadge {
  milestone: 25 | 50 | 75 | 100;
  earnedAt: string; // ISO datetime string
  episodesWatched: number;
}

export interface SavedPlan {
  id: string; // uuid
  animeTitle: string;
  animeMalId: number;
  coverImage: string;
  totalEpisodes: number;
  episodeDuration: number; // minutes per episode
  startDate: string; // ISO date string
  targetDate?: string; // ISO date string — optional (user may not have a deadline)
  createdAt: string; // ISO datetime string
  weeks: ScheduleWeek[];
  summary: ScheduleSummary;
  completedDays?: string[]; // ISO date strings of days marked as watched
  earnedBadges?: MilestoneBadge[];
}

// ─── Scheduling Input Types ──────────────────────────────────────────────────

export type SchedulingMode = "simple" | "ai";

export interface SimpleModeInput {
  episodesPerWeekday: number;
  episodesPerWeekendDay: number;
}

export interface AIModeInput {
  userScheduleDescription: string;
}

export interface GenerateScheduleRequest {
  animeTitle: string;
  totalEpisodes: number;
  episodeDuration: number;
  startDate: string;
  targetDate?: string;
  mode: SchedulingMode;
  simple?: SimpleModeInput;
  ai?: AIModeInput;
}

// ─── API Response Types ──────────────────────────────────────────────────────

export interface SearchApiResponse {
  results: JikanAnimeSearchResult[];
}

export interface AnimeDetailApiResponse {
  mal_id: number;
  title: string;
  title_english: string | null;
  episodes: number | null;
  episodeDurationMinutes: number;
  synopsis: string | null;
  coverImage: string;
  status: string;
}

export interface GenerateScheduleApiResponse {
  weeks: ScheduleWeek[];
  summary: ScheduleSummary;
}

export interface ApiError {
  error: string;
  details?: string;
}
