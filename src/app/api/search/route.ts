import { NextRequest, NextResponse } from "next/server";
import type { SearchApiResponse, ApiError } from "@/types";

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json<ApiError>(
      { error: "Query must be at least 2 characters." },
      { status: 400 }
    );
  }

  try {
    const res = await jikanFetch(
      `${JIKAN_BASE}/anime?q=${encodeURIComponent(query)}&limit=10&sfw=true`,
      { next: { revalidate: 60 } } // cache results for 60s
    );

    if (!res.ok) {
      if (res.status === 429) {
        return NextResponse.json<ApiError>(
          {
            error:
              "Search is temporarily rate limited — please wait a moment and try again.",
          },
          { status: 429 }
        );
      }
      if (res.status >= 500) {
        return NextResponse.json<ApiError>(
          { error: "The anime database is temporarily unavailable — please try again shortly." },
          { status: 503 }
        );
      }
      return NextResponse.json<ApiError>(
        { error: "Couldn't reach the anime database — please try again." },
        { status: res.status }
      );
    }

    const data = await res.json();

    const response: SearchApiResponse = {
      results: data.data ?? [],
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/search]", err);
    return NextResponse.json<ApiError>(
      { error: "The anime database is temporarily unavailable — please try again shortly." },
      { status: 503 }
    );
  }
}
