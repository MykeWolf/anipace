import { NextResponse } from "next/server";

// Temporary debug endpoint — DELETE after diagnosing Vercel AniList issue
export async function GET() {
  const query = `
    query ($search: String) {
      Page(perPage: 2) {
        media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
          idMal
          title { romaji }
        }
      }
    }
  `;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8_000);

    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query, variables: { search: "naruto" } }),
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timer);

    const status = res.status;
    const headers = Object.fromEntries(res.headers.entries());
    const body = await res.text();

    return NextResponse.json({ status, headers, body: body.slice(0, 500) });
  } catch (err) {
    return NextResponse.json({
      error: String(err),
      type: (err as Error).constructor?.name,
    });
  }
}
