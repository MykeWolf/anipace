# AniPace — Project Context for Claude

## What This Is

AniPace is a free web app that turns overwhelming anime episode counts into realistic, day-by-day watching schedules. It targets busy adults (25-40) and is deployed as a link-in-bio tool for an Instagram content creator's audience. No accounts, no auth — fully sessionless with localStorage only.

PRD source: `C:\Users\micha\Desktop\AniPace\AniPace_PRD.md`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.5.12 (App Router) |
| Styling | Tailwind CSS v4 + shadcn/ui v3.8.5 |
| Anime Data | Jikan API v4 (primary) + AniList GraphQL (fallback) |
| AI Scheduling | Google Gemini 2.5 Flash (via `@google/genai`) |
| Storage | Browser localStorage |
| Deployment | Vercel (Hobby tier) — `anipace.vercel.app` |
| Language | TypeScript |

---

## Build Commands

```bash
npm install        # install dependencies
npm run dev        # dev server → http://localhost:3000
npm run build      # production build
npm run lint       # lint check
npx tsc --noEmit   # type-check without building
```

> Node v20.5.1 — some ESLint packages emit engine warnings; ignore them.
> Dev server in `.claude/launch.json` uses `node node_modules/next/dist/bin/next dev` directly (no `--turbopack`). Turbopack is disabled — it has a Windows bug where it tries to read a file named `nul` (a reserved Windows device name), causing a fatal panic.

---

## Environment Variables

Only one required:

```
GEMINI_API_KEY=   # from Google AI Studio (aistudio.google.com)
```

Store in `.env.local` (never commit). Template at `.env.local.example`.

---

## Deployment

Live URL: `https://anipace.vercel.app`

```bash
npx vercel --prod --yes   # force a production deploy + re-link the alias
```

**Important:** After any Vercel project rename or domain alias change, GitHub's
auto-deploy webhook may not update the alias correctly. Always run
`npx vercel --prod --yes` from the project root after renaming to guarantee
`anipace.vercel.app` points to the latest deployment. Also use this when
auto-deploys from GitHub pushes stop triggering (webhook hiccup).

---

## API Routes

| Route | Purpose | Cache TTL |
|-------|---------|-----------|
| `GET /api/search?q={query}` | Jikan search proxy → AniList fallback | 10 min |
| `GET /api/anime/{malId}` | Jikan detail proxy → AniList fallback | 5 min |
| `POST /api/generate-schedule` | Gemini AI schedule generation | no cache |

### Jikan → AniList fallback chain

Both proxy routes use a shared pattern in `src/lib/animeApiFallback.ts`:
- **Jikan** is tried first. `jikanFetch()` has an 8s AbortController timeout and retries once after 1s on 5xx responses.
- If Jikan returns a **persistent 5xx** or throws a **network/timeout error**, the route silently calls AniList instead.
- **429 (rate-limit)** from Jikan is NOT fallback-eligible — it returns a friendly message directly.
- AniList results are normalized to the same `JikanAnimeSearchResult` / `AnimeDetailApiResponse` shapes, so no client component changes are needed.
- AniList uses `idMal` (its built-in MAL ID field) so `mal_id` is always a valid integer in fallback results. Entries without a MAL ID are filtered out.

### Caching strategy

- Jikan search: `next: { revalidate: 600 }` — 10 minutes in Vercel Data Cache
- Jikan detail: `next: { revalidate: 300 }` — 5 minutes in Vercel Data Cache
- AniList search fallback: `unstable_cache` with 10-minute TTL (POST requests can't use `next.revalidate` directly)
- AniList detail fallback: uncached (called rarely, infrequently enough to not need it)

> **Why not in-memory Map?** Vercel serverless functions have no persistent process — a Map resets on every cold start and isn't shared between concurrent invocations. Vercel Data Cache (`next.revalidate` / `unstable_cache`) persists correctly across cold starts.

### POST /api/generate-schedule — AI Mode architecture

Gemini is asked to return a **7-day episode pattern** (one integer per day of week) rather than a full calendar. The server expands the pattern day-by-day into `ScheduleWeek[]`. Scales reliably to long series (One Piece, Naruto, etc.).

Gemini config: `model: "gemini-2.5-flash"`, `responseMimeType: "application/json"`, `temperature: 0.4`.

---

## Source Structure

```
src/
  app/
    api/
      search/route.ts              ← Jikan search proxy + AniList fallback
      anime/[malId]/route.ts       ← Jikan detail proxy + AniList fallback
      generate-schedule/route.ts   ← Gemini AI scheduling (day-pattern approach)
    globals.css                    ← design tokens + always-dark theme
    layout.tsx                     ← Inter font, max-width 480px
    page.tsx                       ← landing page + planner (single page)

  components/
    sections/
      HeroSection.tsx              ← full-bleed banner, headline, CTA pill
      HowItWorksSection.tsx        ← 4-step explainer
      FounderStory.tsx             ← founder copy block + Instagram sign-off
      SiteFooter.tsx               ← Instagram link + credit line
      PlannerSection.tsx           ← "use client" orchestrator for the full planner flow
      SavedPlansSection.tsx        ← localStorage plan cards + scroll-to-planner
    search/
      AnimeSearch.tsx              ← search input + debounced dropdown (300ms)
      AnimeDetailBanner.tsx        ← cover art banner + metadata + manual ep input
    planner/
      PlanningControls.tsx         ← mode toggle, date picker, eps inputs / AI textarea
      ScheduleDisplay.tsx          ← summary stats + collapsible week rows + action buttons
    ui/
      SmoothScrollButton.tsx       ← client component: scrollIntoView without writing hash to URL
      (+ shadcn/ui generated components)

  lib/
    utils.ts                       ← cn() helper (clsx + tailwind-merge)
    generateSchedule.ts            ← Simple Mode client-side schedule generation
    localStorage.ts                ← savePlan / loadPlans / deletePlan / isPlanSaved
    animeApiFallback.ts            ← AniList GraphQL fetch + normalization (server-only)

  types/
    index.ts                       ← all TypeScript interfaces (data model)
```

---

## Versions Installed

- Next.js 15.5.12 + React 19
- Tailwind CSS v4 (CSS-first config — no `tailwind.config.ts`)
- shadcn/ui v3.8.5 (Tailwind v4 compatible)
- `@google/genai` (Gemini SDK — server-side only)
- `components.json` at project root (shadcn config)

---

## next.config.ts — Key Settings

- `allowedDevOrigins: ["127.0.0.1", "localhost"]` — Next.js 15 does NOT support `"*"` wildcard; list origins explicitly or the preview tool shows a "client-side exception" crash.
- `images.remotePatterns` includes: `cdn.myanimelist.net`, `myanimelist.net`, and `s4.anilist.co` (AniList CDN for fallback cover images).

---

## Design Conventions

- **Theme:** Always-dark — `#121212` / `#0F0F0F` background; no light/dark toggle needed
- **Accent:** Muted blue `#8AB4F8`
- **Reference:** Google TV mobile app UI
- **Layout:** Mobile-first, max-width 480px centered on desktop
- **Typography:** Inter or system sans-serif
- **Style:** Generous padding, rounded corners, card-based
- Design tokens live in `globals.css` under `:root` — use CSS custom properties (`bg-background`, `text-foreground-muted`, `bg-accent`, etc.)

---

## Core Features (all implemented)

1. **Landing page** — hero, how it works, founder story, footer; all with real Instagram links (`https://www.instagram.com/themichaelleonard/`)
2. **Anime search** — autocomplete dropdown, 300ms debounce, Jikan → AniList fallback
3. **Anime detail banner** — cover art, title, episode count, duration; manual ep input for ongoing series
4. **Simple Mode** — weekday/weekend episode inputs → client-side schedule generation (no API call)
5. **AI Mode** — natural language textarea → POST `/api/generate-schedule` → Gemini 2.5 Flash → same ScheduleDisplay
6. **Schedule display** — summary stats bar, week-by-week collapsible rows, optional late-finish warning
7. **Save/delete plans** via localStorage (`anipace_plans` key)

---

## Key Conventions & Implementation Decisions

- Use **App Router** (not Pages Router) — all routes in `src/app/`
- Use **shadcn/ui** components; install with `npx shadcn@latest add <component>`
- Keep API keys **server-side only** — Gemini key never exposed to client
- **Tailwind v4**: no `tailwind.config.ts`; all theme customisation via `@theme inline` in `globals.css`
- **PlannerSection** is the `"use client"` orchestrator — holds `selectedAnime`, `manualEpisodes`, `generatedPlan`, `isSaved` state and wires all sub-components together
- **`targetDate` is optional** on `SavedPlan` and `GenerateScheduleRequest` — if omitted, the schedule runs to completion and shows projected finish date instead of a late-finish warning
- **`SmoothScrollButton`** — use this instead of `<a href="#section">` for in-page scroll CTAs; hash-based links write to the URL and cause the browser to scroll on refresh
- **Schedule data shape**: `SavedPlan` → `ScheduleWeek[]` → `ScheduleDay[]` (episodes range + estimatedMinutes)
- **localStorage key**: `anipace_plans` (array of `SavedPlan` objects)
- **Late-finish warning** in `ScheduleDisplay`: only shown when `plan.targetDate` exists and `projectedFinishDate > targetDate`
- **Search error + results race condition**: `setSearchError(null)` is called on every successful search response to clear any lingering error from a prior in-flight request
