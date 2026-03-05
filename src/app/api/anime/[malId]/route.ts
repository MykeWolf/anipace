import { NextRequest, NextResponse } from "next/server";
import type { AnimeDetailApiResponse, ApiError } from "@/types";
import { fetchAniListDetail } from "@/lib/animeApiFallback";

const JIKAN_BASE = "https://api.jikan.moe/v4";
const JIKAN_TIMEOUT_MS = 8_000;

/**
 * Fetch with 8s timeout + 1 automatic retry on 5xx transient errors.
 * Handles the most common Jikan failure modes silently:
 *   - 503 Service Unavailable (maintenance) → retry after 1s
 *   - 500 Server Error (transient) → retry after 1s
 *   - Timeout / network error → retry after 1s
 */
async function jikanFetch(url: string, options: RequestInit): Promise<Response> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), JIKAN_TIMEOUT_MS);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      // Retry once on 5xx (transient outage). Never retry 429 or 4xx.
      if (res.status >= 500 && attempt === 0) {
        await new Promise((r) => setTimeout(r, 1_000));
        continue;
      }
      return res;
    } catch (err) {
      clearTimeout(timer);
      if (attempt === 1) throw err; // re-throw on second failure
      await new Promise((r) => setTimeout(r, 1_000));
    }
  }
  throw new Error("Jikan fetch failed after retries");
}

/** Parse episode duration string like "24 min per ep" → 24 */
function parseDurationMinutes(duration: string | null): number {
  if (!duration) return 24; // sensible default
  const match = duration.match(/(\d+)\s*min/);
  return match ? parseInt(match[1], 10) : 24;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ malId: string }> }
) {
  const { malId } = await params;

  if (!malId || isNaN(Number(malId))) {
    return NextResponse.json<ApiError>(
      { error: "Invalid MAL ID." },
      { status: 400 }
    );
  }

  try {
    const res = await jikanFetch(`${JIKAN_BASE}/anime/${malId}`, {
      next: { revalidate: 300 }, // cache for 5 minutes
    });

    if (!res.ok) {
      if (res.status === 429) {
        return NextResponse.json<ApiError>(
          {
            error:
              "Anime details are temporarily rate limited — please wait a moment.",
          },
          { status: 429 }
        );
      }
      if (res.status >= 500) {
        // Jikan is down — try AniList as fallback
        try {
          const fallback = await fetchAniListDetail(Number(malId));
          return NextResponse.json(fallback);
        } catch {
          return NextResponse.json<ApiError>(
            { error: "The anime database is temporarily unavailable — please try again shortly." },
            { status: 503 }
          );
        }
      }
      return NextResponse.json<ApiError>(
        { error: "Couldn't load anime details — please try again." },
        { status: res.status }
      );
    }

    const { data } = await res.json();

    const response: AnimeDetailApiResponse = {
      mal_id: data.mal_id,
      title: data.title,
      title_english: data.title_english ?? null,
      episodes: data.episodes ?? null,
      episodeDurationMinutes: parseDurationMinutes(data.duration),
      synopsis: data.synopsis ?? null,
      coverImage: data.images?.jpg?.large_image_url ?? data.images?.jpg?.image_url ?? "",
      status: data.status ?? "Unknown",
    };

    return NextResponse.json(response);
  } catch (err) {
    // Network error / timeout — try AniList as fallback
    try {
      const fallback = await fetchAniListDetail(Number(malId));
      return NextResponse.json(fallback);
    } catch {
      console.error("[/api/anime/[malId]] Both Jikan and AniList failed", err);
      return NextResponse.json<ApiError>(
        { error: "The anime database is temporarily unavailable — please try again shortly." },
        { status: 503 }
      );
    }
  }
}
