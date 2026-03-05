/*
 * HeroSection
 *
 * Full-bleed cinematic hero — inspired by Google TV's banner layout.
 * Background: atmospheric dark gradient (placeholder for future anime artwork).
 * Layout: AniPace wordmark at top; headline + subline + CTA pill anchored at bottom,
 * sitting within the gradient-fade zone so text lifts naturally off the background.
 */

import SmoothScrollButton from "@/components/ui/SmoothScrollButton";

export default function HeroSection() {
  return (
    <section
      className="relative flex flex-col overflow-hidden w-full"
      style={{ minHeight: "88svh" }}
    >
      {/* ── Cinematic atmospheric background ─────────────────────────────── */}
      {/*
       * Replicates the "large blurred artwork at low opacity" feel from the PRD
       * using layered CSS gradients. Replace the outermost div's background with
       * a Next.js <Image> once real anime artwork is available.
       */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: [
            /* Blue halo — references the accent colour */
            "radial-gradient(ellipse 120% 60% at 50% -5%, rgba(100,148,240,0.18) 0%, transparent 58%)",
            /* Side depth */
            "radial-gradient(ellipse 50% 40% at 80% 70%, rgba(90,110,200,0.07) 0%, transparent 50%)",
            /* Base gradient: near-black deep blue → background */
            "linear-gradient(175deg, #08081f 0%, #0c0c1c 20%, #0f0f18 45%, #121212 75%)",
          ].join(", "),
        }}
      />

      {/* ── Bottom gradient: strong fade to page background ───────────────── */}
      <div
        aria-hidden
        className="absolute bottom-0 inset-x-0 h-[55%] pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, #121212 0%, #121212 15%, rgba(18,18,18,0.85) 45%, transparent 100%)",
        }}
      />

      {/* ── AniPace wordmark (top of hero) ───────────────────────────────── */}
      <div className="relative z-10 pt-10 px-6 text-center">
        <span className="text-[0.6875rem] font-bold tracking-[0.28em] uppercase text-accent/90 select-none">
          AniPace
        </span>
        <p className="text-[0.6875rem] text-foreground-muted/50 mt-1 tracking-wide">
          by{" "}
          <a
            href="https://www.instagram.com/themichaelleonard/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground-muted transition-colors"
          >
            @themichaelleonard
          </a>
        </p>
      </div>

      {/* ── Spacer: pushes content to bottom ─────────────────────────────── */}
      <div className="flex-1 min-h-[4rem]" />

      {/* ── Main content: headline + subline + CTA ───────────────────────── */}
      <div className="relative z-10 px-6 pb-16 text-center">
        <h1 className="text-[2.125rem] leading-[1.18] font-bold tracking-tight text-white mb-5">
          Stop saying you&apos;ll watch it.{" "}
          <span className="text-accent">Actually&nbsp;finish&nbsp;it.</span>
        </h1>

        <p className="text-[0.9375rem] leading-relaxed text-foreground-muted mb-10 max-w-[300px] mx-auto">
          Tell us the anime, tell us your schedule, and we&apos;ll build a watching
          plan that fits your real life. No more staring at 500 episodes wondering
          where to start.
        </p>

        <SmoothScrollButton
          targetId="planner"
          className="
            inline-flex items-center justify-center w-full
            rounded-[999px] bg-accent text-[#0f0f0f]
            font-semibold text-[0.9375rem] py-[0.9375rem]
            transition-opacity hover:opacity-90 active:opacity-75
          "
        >
          Plan Your Watch
        </SmoothScrollButton>
      </div>
    </section>
  );
}
