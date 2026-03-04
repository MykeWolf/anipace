/*
 * AnimeDetailBanner
 *
 * PRD: "show the anime detail in a style similar to the Google TV detail page:
 * large cover/banner artwork at the top of the section, bleeding edge-to-edge,
 * with a gradient fade to the background. Below the artwork: anime title in
 * large bold white, episode count and episode duration as muted metadata."
 *
 * Image is cropped to ~58svh, positioned object-top (shows character faces).
 * A strong gradient fades from transparent → #121212 so the title appears to
 * emerge from the bottom of the artwork — no hard edge between image and page.
 */

import Image from "next/image";
import type { AnimeDetailApiResponse } from "@/types";

interface Props {
  anime: AnimeDetailApiResponse;
  /** Controlled value for the manual episode count (ongoing series only). */
  manualEpisodes: string;
  onManualEpisodesChange: (value: string) => void;
}

export default function AnimeDetailBanner({
  anime,
  manualEpisodes,
  onManualEpisodesChange,
}: Props) {
  const isOngoing = anime.episodes === null;
  const episodeCount = isOngoing
    ? manualEpisodes
      ? parseInt(manualEpisodes, 10)
      : null
    : anime.episodes;

  const metaLine = episodeCount
    ? `${episodeCount.toLocaleString()} episodes · ${anime.episodeDurationMinutes} min each`
    : `${anime.episodeDurationMinutes} min per episode · ${anime.status}`;

  // Short-series hint (PRD edge case)
  const shortHint =
    episodeCount !== null && episodeCount <= 5
      ? "✨ You could finish this in one sitting!"
      : episodeCount !== null && episodeCount <= 12
        ? "⚡ Short series — great for a weekend binge."
        : null;

  return (
    <div className="w-full mt-5">
      {/* ── Cover art (full bleed, ~58svh) ───────────────────────────────── */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: "58svh", minHeight: "220px", maxHeight: "360px" }}
      >
        {/* Artwork */}
        <Image
          src={anime.coverImage}
          alt={`${anime.title} cover art`}
          fill
          priority
          sizes="480px"
          className="object-cover object-top"
        />

        {/*
         * Gradient overlay: transparent at top → solid background at bottom.
         * Three-stop gradient for a smooth, cinematic fade.
         */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, " +
              "rgba(18,18,18,0) 0%, " +
              "rgba(18,18,18,0) 30%, " +
              "rgba(18,18,18,0.6) 60%, " +
              "#121212 90%)",
          }}
        />

        {/* Title + meta anchored at the bottom of the banner */}
        <div className="absolute bottom-0 inset-x-0 px-6 pb-5 z-10">
          <h2 className="text-[1.375rem] font-bold text-white leading-tight drop-shadow-sm">
            {anime.title_english ?? anime.title}
          </h2>
          <p className="text-[0.8125rem] text-foreground-muted mt-1.5">
            {metaLine}
          </p>
          {shortHint && (
            <p className="text-[0.75rem] text-accent mt-1.5 font-medium">
              {shortHint}
            </p>
          )}
        </div>
      </div>

      {/* ── Manual episode count — only for ongoing / null episode count ── */}
      {isOngoing && (
        <div className="px-6 mt-5">
          <p className="text-[0.8125rem] text-foreground-muted mb-2 leading-snug">
            This series is still airing — how many episodes are currently out?
          </p>
          <input
            type="number"
            min="1"
            inputMode="numeric"
            value={manualEpisodes}
            onChange={(e) => onManualEpisodesChange(e.target.value)}
            placeholder="e.g. 1000"
            aria-label="Current episode count"
            className="
              w-full rounded-[12px] bg-surface-elevated
              px-4 py-3.5
              text-[0.9375rem] text-foreground placeholder:text-foreground-muted
              border border-border
              outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20
              transition-colors
            "
          />
        </div>
      )}
    </div>
  );
}
