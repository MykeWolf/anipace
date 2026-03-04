import { NextRequest, NextResponse } from "next/server";
import type { SearchApiResponse, ApiError } from "@/types";

const JIKAN_BASE = "https://api.jikan.moe/v4";

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
    const res = await fetch(
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
      throw new Error(`Jikan API error: ${res.status}`);
    }

    const data = await res.json();

    const response: SearchApiResponse = {
      results: data.data ?? [],
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/search]", err);
    return NextResponse.json<ApiError>(
      { error: "Failed to fetch anime search results." },
      { status: 500 }
    );
  }
}
