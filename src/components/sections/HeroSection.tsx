/*
 * HeroSection
 *
 * Full-bleed cinematic hero — inspired by Google TV's banner layout.
 * Background: atmospheric dark gradient (placeholder for future anime artwork).
 * Layout: AniPace wordmark at top; headline + subline + CTA pill anchored at bottom,
 * sitting within the gradient-fade zone so text lifts naturally off the background.
 */

import SmoothScrollButton from "@/components/ui/SmoothScrollButton";
import AuthButton from "@/components/auth/AuthButton";

export default function HeroSection() {
  return (
    <section
      className="relative flex flex-col w-full min-h-[72svh] md:min-h-[62vh]"
    >
      {/* ── Cinematic atmospheric background — full viewport width ──────── */}
      <div
        aria-hidden
        className="absolute top-0 bottom-0 pointer-events-none"
        style={{
          left: "50%",
          transform: "translateX(-50%)",
          width: "100vw",
          background: [
            "radial-gradient(ellipse 120% 60% at 50% -5%, rgba(100,148,240,0.18) 0%, transparent 58%)",
            "radial-gradient(ellipse 50% 40% at 80% 70%, rgba(90,110,200,0.07) 0%, transparent 50%)",
            "linear-gradient(175deg, #08081f 0%, #0c0c1c 20%, #0f0f18 45%, #121212 75%)",
          ].join(", "),
        }}
      />

      {/* ── Bottom gradient: full viewport width fade ─────────────────────── */}
      <div
        aria-hidden
        className="absolute bottom-0 h-[55%] pointer-events-none"
        style={{
          left: "50%",
          transform: "translateX(-50%)",
          width: "100vw",
          background:
            "linear-gradient(to top, #121212 0%, #121212 15%, rgba(18,18,18,0.85) 45%, transparent 100%)",
        }}
      />

      {/* ── AniPace wordmark (top of hero) ───────────────────────────────── */}
      <div className="relative z-10 pt-10 px-6 flex items-start animate-hero-fade-up" style={{ animationDelay: "0ms" }}>
        {/* left spacer keeps wordmark visually centered */}
        <div className="flex-1" />
        <div className="text-center">
          <span className="text-[1.125rem] font-bold tracking-[0.18em] uppercase text-accent/90 select-none" style={{ fontFamily: "var(--font-display)" }}>
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
        <div className="flex-1 flex justify-end pt-1">
          <AuthButton />
        </div>
      </div>

      {/* ── Spacer: pushes content to bottom (capped on desktop) ────────── */}
      <div className="flex-1 min-h-[4rem] md:max-h-40" />

      {/* ── Main content: headline + subline + CTA ───────────────────────── */}
      <div className="relative z-10 px-6 pb-16 text-center">
        <h1
          className="text-[2.125rem] md:text-[2.75rem] lg:text-[3.25rem] leading-[1.18] font-bold tracking-tight text-white mb-5 animate-hero-fade-up"
          style={{ animationDelay: "120ms" }}
        >
          Stop saying you&apos;ll watch it.{" "}
          <span className="text-accent">Actually&nbsp;finish&nbsp;it.</span>
        </h1>

        <p
          className="text-[0.9375rem] leading-relaxed text-foreground-muted mb-14 max-w-[300px] mx-auto animate-hero-fade-up"
          style={{ animationDelay: "240ms" }}
        >
          Tell us the anime, tell us your schedule, and we&apos;ll build a watching
          plan that fits your real life. No more staring at 500 episodes wondering
          where to start.
        </p>

        <div className="animate-hero-fade-up" style={{ animationDelay: "360ms" }}>
          <SmoothScrollButton
            targetId="planner"
            className="
              inline-flex items-center justify-center w-full md:max-w-sm md:mx-auto
              rounded-[999px] bg-accent text-[#0f0f0f]
              font-semibold text-[0.9375rem] py-[0.9375rem]
              transition-opacity hover:opacity-90 active:opacity-75
              animate-cta-pulse
            "
          >
            Plan Your Watch
          </SmoothScrollButton>
        </div>
      </div>
    </section>
  );
}
