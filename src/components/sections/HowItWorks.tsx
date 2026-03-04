/*
 * HowItWorks
 *
 * Four numbered steps. PRD: "Simple vertical stack, 4 steps — each step is a
 * short line of text with a step number, keep it minimal, no icons needed."
 */

const STEPS = [
  "Pick your anime",
  "Set when you want to finish by",
  "Tell us when you're actually free",
  "Get a week-by-week plan you can stick to",
] as const;

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 pt-16 pb-14">
      {/* Section header */}
      <h2 className="text-[1.125rem] font-bold text-foreground mb-10 tracking-tight">
        How it works
      </h2>

      {/* Steps */}
      <ol className="space-y-7">
        {STEPS.map((step, i) => (
          <li key={step} className="flex items-start gap-5">
            {/* Step number */}
            <span
              className="flex-shrink-0 w-7 h-7 rounded-full border border-accent/40 flex items-center justify-center
                         text-[0.75rem] font-bold text-accent"
              aria-hidden
            >
              {i + 1}
            </span>

            {/* Step text */}
            <span className="text-[0.9375rem] text-foreground leading-snug pt-[0.3125rem]">
              {step}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
