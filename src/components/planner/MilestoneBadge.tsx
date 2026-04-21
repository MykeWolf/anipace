import Image from "next/image";
import type { MilestoneBadge as MilestoneBadgeType, SavedPlan } from "@/types";

interface Props {
  badge: MilestoneBadgeType;
  plan: SavedPlan;
}

export default function MilestoneBadge({ badge, plan }: Props) {
  return (
    <div
      className="relative w-full max-w-[320px] mx-auto rounded-[16px] overflow-hidden select-none"
      style={{ height: 180 }}
    >
      {/* Cover art */}
      <Image
        src={plan.coverImage}
        alt={plan.animeTitle}
        fill
        sizes="320px"
        className="object-cover object-top"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

      {/* Centered content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-4 text-center">
        <span className="text-[3rem] font-black text-accent leading-none">
          {badge.milestone}%
        </span>
        <span className="text-white font-bold text-[1rem] line-clamp-1">
          {plan.animeTitle}
        </span>
        <span className="text-white/70 text-[0.8125rem]">
          {badge.episodesWatched} of {plan.totalEpisodes} episodes complete
        </span>
      </div>

      {/* AniPace watermark */}
      <span className="absolute bottom-2.5 right-3 text-[0.625rem] text-white/40 font-medium tracking-wide">
        AniPace
      </span>
    </div>
  );
}
