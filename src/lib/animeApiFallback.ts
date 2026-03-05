/**
 * animeApiFallback.ts — SERVER-ONLY
 *
 * AniList GraphQL fallback for when Jikan is unavailable.
 * Results are normalized to the same shapes the app already uses
 * (JikanAnimeSearchResult / AnimeDetailApiResponse) so no client
 * component changes are needed.
 *
 * AniList limits: 90 req/min, no auth required.
 * GraphQL endpoint: https://graphql.anilist.co
 */

import { unstable_cache } from "next/cache";
import type { JikanAnimeSearchResult, AnimeDetailApiResponse } from "@/types";

const ANILIST_URL = "https://graphql.anilist.co";
const ANILIST_TIMEOUT_MS = 8_000;

// ── AniList status → Jikan status string ─────────────────────────────────────

const STATUS_MAP: Record<string, string> = {
  FINISHED: "Finished Airing",
  RELEASING: "Currently Airing",
  NOT_YET_RELEASED: "Not yet aired",
  CANCELLED: "Finished Airing", // closest available value
  HIATUS: "Currently Airing",
};

// ── Internal AniList response shapes ─────────────────────────────────────────

interface AniListCoverImage {
  extraLarge: string | null;
  large: string | null;
}

interface AniListTitle {
  romaji: string | null;
  english: string | null;
}

interface AniListSearchMedia {
  idMal: number | null;
  title: AniListTitle;
  episodes: number | null;
  duration: number | null; // minutes per episode
  status: string;
  coverImage: AniListCoverImage;
}

interface AniListDetailMedia {
  idMal: number | null;
  title: AniListTitle;
  episodes: number | null;
  duration: number | null;
  description: string | null; // may contain HTML tags
  status: string;
  coverImage: AniListCoverImage;
}

// ── Shared fetch helper ───────────────────────────────────────────────────────

async function anilistFetch(
  query: string,
  variables: Record<string, unknown>
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ANILIST_TIMEOUT_MS);
  try {
    const res = await fetch(ANILIST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`AniList HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Remove HTML tags from AniList descriptions (e.g. <br>, <i>, <b>). */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function resolveStatus(raw: string): string {
  return STATUS_MAP[raw] ?? "Unknown";
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Search AniList and return results normalized to JikanAnimeSearchResult[].
 * Entries without a MAL ID are filtered out so the rest of the app can always
 * rely on mal_id being a valid positive integer.
 *
 * Results are cached for 10 minutes via Next.js Data Cache (matches the
 * Jikan search revalidation window) to reduce AniList hits during outages.
 */
export const searchAniList = unstable_cache(
  async (searchQuery: string): Promise<JikanAnimeSearchResult[]> => {
    const GQL = `
      query ($search: String) {
        Page(perPage: 10) {
          media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
            idMal
            title { romaji english }
            episodes
            duration
            status
            coverImage { extraLarge large }
          }
        }
      }
    `;

    const json = (await anilistFetch(GQL, { search: searchQuery })) as {
      data: { Page: { media: AniListSearchMedia[] } };
    };

    const items: AniListSearchMedia[] = json.data?.Page?.media ?? [];

    return items
      .filter((m): m is AniListSearchMedia & { idMal: number } => m.idMal != null)
      .map((m) => {
        const imageUrl = m.coverImage.large ?? "";
        const largeImageUrl = m.coverImage.extraLarge ?? m.coverImage.large ?? "";

        const image = {
          image_url: imageUrl,
          small_image_url: imageUrl,
          large_image_url: largeImageUrl,
        };

        return {
          mal_id: m.idMal,
          title: m.title.romaji ?? m.title.english ?? "Unknown",
          title_english: m.title.english ?? null,
          episodes: m.episodes ?? null,
          status: resolveStatus(m.status) as JikanAnimeSearchResult["status"],
          images: { jpg: image, webp: image },
          synopsis: null, // omitted from search for speed
          duration: m.duration != null ? `${m.duration} min per ep` : null,
          score: null,
          year: null,
        };
      });
  },
  ["anilist-search"], // cache key prefix — query string is appended automatically
  { revalidate: 600 } // 10-minute TTL, matching Jikan search cache
);

/**
 * Fetch anime detail from AniList by MAL ID.
 * Returns an AnimeDetailApiResponse normalized to the same shape as the Jikan
 * detail proxy so no other code needs to change.
 *
 * Throws if AniList cannot find an entry for the given MAL ID.
 */
export async function fetchAniListDetail(
  malId: number
): Promise<AnimeDetailApiResponse> {
  const GQL = `
    query ($idMal: Int) {
      Media(idMal: $idMal, type: ANIME) {
        idMal
        title { romaji english }
        episodes
        duration
        description
        status
        coverImage { extraLarge large }
      }
    }
  `;

  const json = (await anilistFetch(GQL, { idMal: malId })) as {
    data: { Media: AniListDetailMedia | null };
  };

  const m = json.data?.Media;
  if (!m || m.idMal == null) {
    throw new Error(`AniList: no entry found for MAL ID ${malId}`);
  }

  return {
    mal_id: m.idMal,
    title: m.title.romaji ?? m.title.english ?? "Unknown",
    title_english: m.title.english ?? null,
    episodes: m.episodes ?? null,
    episodeDurationMinutes: m.duration ?? 24,
    synopsis: m.description ? stripHtml(m.description) : null,
    coverImage: m.coverImage.extraLarge ?? m.coverImage.large ?? "",
    status: resolveStatus(m.status),
  };
}
