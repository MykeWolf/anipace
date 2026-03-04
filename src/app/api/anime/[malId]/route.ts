import { NextRequest, NextResponse } from "next/server";
import type { AnimeDetailApiResponse, ApiError } from "@/types";

const JIKAN_BASE = "https://api.jikan.moe/v4";

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
    const res = await fetch(`${JIKAN_BASE}/anime/${malId}`, {
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
      throw new Error(`Jikan API error: ${res.status}`);
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
    console.error("[/api/anime/[malId]]", err);
    return NextResponse.json<ApiError>(
      { error: "Failed to fetch anime details." },
      { status: 500 }
    );
  }
}
