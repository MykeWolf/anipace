interface Props {
  completedCount: number;
  totalEpisodeDays: number;
  episodesWatched: number;
  totalEpisodes: number;
}

export default function ProgressBar({
  completedCount,
  totalEpisodeDays,
  episodesWatched,
  totalEpisodes,
}: Props) {
  const pct =
    totalEpisodes > 0
      ? Math.round((episodesWatched / totalEpisodes) * 100)
      : 0;

  return (
    <div className="mx-6 mb-5">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-[0.8125rem] text-foreground-muted">
          Episode {episodesWatched} of {totalEpisodes} · {pct}%
        </span>
        <span className="text-[0.75rem] text-foreground-muted/60">
          {completedCount}/{totalEpisodeDays} days
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-divider overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
