# AniPace — Project Context for Claude

## What This Is

AniPace is a free web app that turns overwhelming anime episode counts into realistic, day-by-day watching schedules. It targets busy adults (25-40) and is deployed as a link-in-bio tool for an Instagram content creator's audience. No accounts, no auth — fully sessionless with localStorage only.

PRD source: `C:\Users\micha\Desktop\AniPace\AniPace_PRD.md`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Anime Data | Jikan API v4 (free, no auth required) |
| AI Scheduling | Google Gemini 2.5 Flash (via `@google/genai`) |
| Storage | Browser localStorage |
| Deployment | Vercel (free tier) |
| Language | TypeScript |

---

## Build Commands

```bash
npm install        # install dependencies
npm run dev        # dev server → http://localhost:3000 (uses Turbopack)
npm run build      # production build (uses Turbopack)
npm run lint       # lint check
```

> Node v20.5.1 — some ESLint packages emit engine warnings, they can be ignored.
> Dev server command in `.claude/launch.json` uses `node node_modules/next/dist/bin/next dev` directly (no `--turbopack`). Turbopack is disabled because it has a Windows-specific bug where it tries to read a file named `nul` (a reserved Windows device name), causing a fatal panic. The webpack-based dev server is stable.

---

## Environment Variables

Only one required:

```
GEMINI_API_KEY=   # from Google AI Studio (aistudio.google.com)
```

Store in `.env.local` (never commit). Template at `.env.local.example`.

---

## API Routes

| Route | Purpose | Status |
|-------|---------|--------|
| `GET /api/search?q={query}` | Proxy Jikan anime search | ✅ implemented |
| `GET /api/anime/{malId}` | Proxy Jikan anime detail (episode count, duration) | ✅ implemented |
| `POST /api/generate-schedule` | Gemini AI schedule generation | ✅ implemented |

Jikan base URL: `https://api.jikan.moe/v4`

### POST /api/generate-schedule — AI Mode architecture

Gemini is asked to return a **7-day episode pattern** (one integer per day of week) rather than a full calendar. The server then expands the pattern day-by-day into `ScheduleWeek[]`. This is more reliable for structured output and scales to long series (One Piece, Naruto, etc.) without huge responses.

Gemini config: `model: "gemini-2.5-flash"`, `responseMimeType: "application/json"`, `temperature: 0.4`.

---

## Source Structure

```
src/
  app/
    api/
      search/route.ts              ← Jikan search proxy
      anime/[malId]/route.ts       ← Jikan detail proxy
      generate-schedule/route.ts   ← Gemini AI scheduling (day-pattern approach)
    globals.css                    ← design tokens + always-dark theme
    layout.tsx                     ← Inter font, max-width 480px
    page.tsx                       ← landing page + planner (single page)

  components/
    landing/
      HeroSection.tsx              ← full-bleed banner, headline, CTA
      HowItWorksSection.tsx        ← 4-step explainer
      FounderStorySection.tsx      ← founder copy block
      SiteFooter.tsx               ← Instagram link + credit
    search/
      AnimeSearch.tsx              ← search input + debounced dropdown
      AnimeDetailBanner.tsx        ← cover art banner + metadata + manual ep input
    planner/
      PlanningControls.tsx         ← mode toggle, date picker, eps inputs / AI textarea
      ScheduleDisplay.tsx          ← summary stats + collapsible week rows + action buttons
    sections/
      PlannerSection.tsx           ← "use client" orchestrator for the full planner flow
    ui/                            ← shadcn/ui generated components

  lib/
    utils.ts                       ← cn() helper (clsx + tailwind-merge)
    generateSchedule.ts            ← Simple Mode client-side schedule generation
    localStorage.ts                ← savePlan / loadPlans / deletePlan / isPlanSaved

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

1. **Landing page** — hero, how it works, founder story, footer
2. **Anime search** with autocomplete dropdown (Jikan API, 300ms debounce)
3. **Anime detail banner** — cover art, title, episode count, duration; manual ep input for ongoing series
4. **Simple Mode** — weekday/weekend episode inputs → client-side schedule generation (no API call)
5. **AI Mode** — natural language textarea → POST `/api/generate-schedule` → Gemini 2.5 Flash → same ScheduleDisplay
6. **Schedule display** — summary stats bar, week-by-week collapsible rows, late-finish warning
7. **Save/delete plans** via localStorage (`anipace_plans` key)

---

## Key Conventions

- Use **App Router** (not Pages Router) — all routes in `src/app/`
- Use **shadcn/ui** components; install with `npx shadcn@latest add <component>`
- Keep API keys **server-side only** — Gemini key never exposed to client
- Jikan API rate limits (~3 req/sec) — search input debounced at 300ms
- **Tailwind v4**: no `tailwind.config.ts`; all theme customisation via `@theme inline` in `globals.css`
- **PlannerSection** is the `"use client"` orchestrator — holds `selectedAnime`, `manualEpisodes`, `generatedPlan`, `isSaved` state and wires all sub-components together
- Schedule data shape: `SavedPlan` → `ScheduleWeek[]` → `ScheduleDay[]` (episodes range + estimatedMinutes)
- localStorage key: `anipace_plans` (array of `SavedPlan` objects)
- Late-finish warning lives in `ScheduleDisplay` (compares `plan.summary.projectedFinishDate > plan.targetDate`)
