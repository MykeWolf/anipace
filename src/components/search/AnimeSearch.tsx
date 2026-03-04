"use client";

/**
 * AnimeSearch
 *
 * Manages the search input + autocomplete dropdown flow:
 *   1. User types → debounced GET /api/search → shows dropdown results
 *   2. User selects result → GET /api/anime/{malId} → calls onSelect(detail)
 *   3. User clears input or starts a new search → calls onClear()
 *
 * This component no longer renders AnimeDetailBanner — the parent
 * (PlannerSection) owns "selected" state and renders the banner itself.
 *
 * PRD design spec:
 *   - Full-width input, rounded-[12px], bg #1E1E1E, subtle border
 *   - Placeholder: "Search for an anime..."
 *   - Each dropdown row: thumbnail | title (white) | ep count (muted)
 *   - Tapping a result selects it and closes the dropdown
 */

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import type {
  JikanAnimeSearchResult,
  AnimeDetailApiResponse,
  ApiError,
} from "@/types";

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconSearch() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function IconX() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <path
        d="M1 1l11 11M12 1L1 12"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Spinner({ size = 16 }: { size?: number }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className="block rounded-full border-2 border-foreground-muted/25 border-t-accent animate-spin"
      style={{ width: size, height: size }}
    />
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  /** Called once the anime detail has been fetched (or a fallback built). */
  onSelect: (anime: AnimeDetailApiResponse) => void;
  /** Called when the user explicitly clears the search field. */
  onClear: () => void;
}

export default function AnimeSearch({ onSelect, onClear }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<JikanAnimeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * When the user picks a result we programmatically set the query string
   * to the anime title. This ref prevents the search useEffect from
   * re-firing for that programmatic change.
   */
  const suppressSearchRef = useRef(false);

  /**
   * Track whether a result was selected so we know to call onClear() when
   * the user starts typing a new search query.
   */
  const hasSelectionRef = useRef(false);

  // ── Debounced search ────────────────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearchError(null);

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      if (suppressSearchRef.current) {
        suppressSearchRef.current = false;
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (!res.ok) {
          const errData: ApiError = await res.json().catch(() => ({}));
          setSearchError(
            errData.error ?? "Search failed — please try again."
          );
          setIsOpen(false);
          return;
        }
        const data = await res.json();
        const hits: JikanAnimeSearchResult[] = data.results ?? [];
        setResults(hits);
        setIsOpen(hits.length > 0);
      } catch {
        setSearchError("Search failed — please try again.");
        setIsOpen(false);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // ── Close dropdown on outside click ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Close on Escape ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // ── Select a result ─────────────────────────────────────────────────────────
  async function handleSelect(anime: JikanAnimeSearchResult) {
    setIsOpen(false);
    suppressSearchRef.current = true;
    hasSelectionRef.current = true;
    setQuery(anime.title);
    setIsLoadingDetail(true);

    try {
      const res = await fetch(`/api/anime/${anime.mal_id}`);
      if (!res.ok) throw new Error("detail fetch failed");
      const detail: AnimeDetailApiResponse = await res.json();
      onSelect(detail);
    } catch {
      // Graceful fallback — use data we already have from the search results
      onSelect({
        mal_id: anime.mal_id,
        title: anime.title,
        title_english: anime.title_english,
        episodes: anime.episodes,
        episodeDurationMinutes: 24,
        synopsis: anime.synopsis,
        coverImage:
          anime.images.jpg.large_image_url ?? anime.images.jpg.image_url,
        status: anime.status,
      });
    } finally {
      setIsLoadingDetail(false);
    }
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    hasSelectionRef.current = false;
    onClear();
    inputRef.current?.focus();
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="w-full">
      {/* Search input + dropdown */}
      <div ref={containerRef} className="relative px-6">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              suppressSearchRef.current = false;
              // If the user starts typing after a selection, clear the parent's state
              if (hasSelectionRef.current) {
                hasSelectionRef.current = false;
                onClear();
              }
              setQuery(e.target.value);
            }}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true);
            }}
            placeholder="Search for an anime..."
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Search for an anime"
            aria-haspopup="listbox"
            aria-controls="anime-search-listbox"
            className="
              w-full rounded-[12px] bg-surface-elevated
              px-4 py-[0.875rem] pr-11
              text-[0.9375rem] text-foreground placeholder:text-foreground-muted
              border border-border
              outline-none
              focus:border-accent/50 focus:ring-1 focus:ring-accent/20
              transition-colors
            "
          />

          {/* Right icon: spinner → clear × → search icon */}
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground-muted flex items-center">
            {isSearching ? (
              <Spinner />
            ) : query ? (
              <button
                onClick={handleClear}
                aria-label="Clear search"
                className="p-1 rounded-full hover:text-foreground transition-colors"
              >
                <IconX />
              </button>
            ) : (
              <IconSearch />
            )}
          </div>
        </div>

        {/* Inline search error */}
        {searchError && (
          <p className="mt-2 text-xs text-destructive px-1">{searchError}</p>
        )}

        {/* Dropdown */}
        {isOpen && results.length > 0 && (
          <ul
            role="listbox"
            aria-label="Anime search results"
            className="
              absolute top-full left-6 right-6 z-50 mt-1.5
              rounded-[12px] bg-surface border border-border
              overflow-hidden shadow-2xl shadow-black/60
              divide-y divide-border
            "
          >
            {results.map((anime) => (
              <li key={anime.mal_id} role="option" aria-selected={false}>
                <button
                  onClick={() => handleSelect(anime)}
                  className="
                    flex w-full items-center gap-3 px-3 py-2.5
                    hover:bg-surface-elevated active:bg-surface-elevated/80
                    transition-colors text-left
                  "
                >
                  {/* Thumbnail */}
                  <div className="relative flex-shrink-0 w-9 h-12 rounded-[6px] overflow-hidden bg-border">
                    {anime.images.jpg.image_url && (
                      <Image
                        src={anime.images.jpg.image_url}
                        alt=""
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    )}
                  </div>

                  {/* Title + metadata */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.875rem] font-medium text-foreground truncate leading-snug">
                      {anime.title}
                    </p>
                    <p className="text-[0.75rem] text-foreground-muted mt-0.5">
                      {anime.episodes != null
                        ? `${anime.episodes.toLocaleString()} eps`
                        : "Ongoing"}
                      {" · "}
                      {anime.status === "Currently Airing"
                        ? "Airing"
                        : "Finished"}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Loading spinner while fetching detail */}
      {isLoadingDetail && (
        <div className="flex items-center justify-center gap-3 py-16 text-[0.875rem] text-foreground-muted">
          <Spinner size={18} />
          Loading anime info…
        </div>
      )}
    </div>
  );
}
