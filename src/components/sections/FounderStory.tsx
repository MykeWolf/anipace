/*
 * FounderStory
 *
 * PRD: "Plain text block on the dark background. Slightly larger line-height for
 * readability. No card or container — just text floating on the dark surface."
 *
 * Copy is taken verbatim from the PRD's Founder Story appendix.
 */

export default function FounderStory() {
  return (
    <section className="px-6 pt-2 pb-16 border-t border-border">
      <div
        className="mt-12 space-y-5 text-[0.9375rem] leading-[1.8] text-foreground-muted"
      >
        {/* Opening line — slightly emphasised */}
        <p className="text-foreground font-medium text-[1rem] leading-snug">
          I love anime. I just stopped watching it.
        </p>

        <p>
          Not on purpose. But somewhere between getting older and getting busier,
          I went from finishing a series in a weekend to not finishing one in a
          year. I&apos;d see something I wanted to watch, check the episode count,
          and immediately feel behind before I even started.
        </p>

        {/* Isolated quote for rhythm — matches how the PRD copy reads */}
        <p className="text-foreground font-medium">
          365 episodes. Where do you even begin?
        </p>

        <p>
          So I built this. You pick the anime, tell it when you&apos;re free,
          and it gives you a plan that actually fits your week. No pressure, no
          binging, just a realistic schedule so you can stop saying &ldquo;I&apos;ll
          get to it&rdquo; and actually get to it.
        </p>
      </div>
    </section>
  );
}
