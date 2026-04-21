import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — AniPace",
  description:
    "How AniPace handles your data. We keep it simple: your plans stay on your device, we never sell your data, and we're transparent about the tools we use.",
};

const LAST_UPDATED = "21 April 2026";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* ── Top nav ── */}
      <div className="px-6 pt-8 pb-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[0.8125rem] font-bold text-foreground-muted/60 uppercase tracking-widest hover:text-foreground transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
            className="flex-shrink-0"
          >
            <path
              d="M10 12L6 8l4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to AniPace
        </Link>
      </div>

      {/* ── Content ── */}
      <article className="px-6 pt-10 pb-20 max-w-2xl">
        {/* Header */}
        <header className="mb-10 border-b border-border pb-8">
          <p className="text-[0.75rem] font-bold uppercase tracking-widest text-foreground-muted/50 mb-3">
            Legal
          </p>
          <h1 className="text-[2rem] font-bold leading-tight tracking-tight text-foreground">
            Privacy Policy
          </h1>
          <p className="mt-3 text-[0.875rem] text-foreground-muted">
            Last updated: {LAST_UPDATED}
          </p>
        </header>

        {/* Intro */}
        <p className="text-[0.9375rem] text-foreground-muted leading-relaxed mb-10">
          AniPace is a free tool for planning your anime watching schedule.
          This page explains what data we collect, how we use it, and your rights.
          We try to collect as little as possible.
        </p>

        <div className="flex flex-col gap-10">
          {/* Section 1 */}
          <Section title="1. Your Anime Plans">
            <p>
              When you create and save a schedule, it is stored{" "}
              <strong className="text-foreground">directly on your device</strong> using
              browser Local Storage. We do not transmit or back up your plans to
              our servers unless you sign in and enable account sync.
            </p>
            <p>
              This means your plans are private by default — only accessible from
              the browser and device you used to create them. Clearing your browser
              data will remove your saved plans.
            </p>
          </Section>

          {/* Section 2 */}
          <Section title="2. Account & Email">
            <p>
              If you sign up for an account, we store your{" "}
              <strong className="text-foreground">email address</strong> via Supabase
              (our authentication provider). This is used solely to identify
              your account and sync your plans across devices.
            </p>
            <p>
              If you subscribe to the AniPace newsletter, your email is stored
              to send you product updates. You can unsubscribe at any time via
              the link in any email we send. We do not share your email with
              third parties.
            </p>
            <p>
              To request deletion of your account and associated data, email us at{" "}
              <a
                href="mailto:michaeloleonard2020@gmail.com"
                className="text-primary hover:underline"
              >
                michaeloleonard2020@gmail.com
              </a>
              .
            </p>
          </Section>

          {/* Section 3 */}
          <Section title="3. AI Schedule Generation">
            <p>
              When you use AI Mode, your{" "}
              <strong className="text-foreground">anime title</strong> and{" "}
              <strong className="text-foreground">schedule description</strong> are
              sent to the <strong className="text-foreground">Google Gemini API</strong>{" "}
              to generate a personalised schedule. No account details or personal
              identifiers are included in this request.
            </p>
            <p>
              We do not store this input on our servers. Google may process this
              data according to their own privacy policy:{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                policies.google.com/privacy
              </a>
              .
            </p>
          </Section>

          {/* Section 4 */}
          <Section title="4. Third-Party Services">
            <p>We use the following external services to run AniPace:</p>
            <ul className="flex flex-col gap-2 mt-2 pl-4 border-l border-border">
              <li className="text-foreground-muted text-[0.875rem]">
                <strong className="text-foreground">Supabase</strong> — authentication
                and optional cloud storage.{" "}
                <a
                  href="https://supabase.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Privacy Policy ↗
                </a>
              </li>
              <li className="text-foreground-muted text-[0.875rem]">
                <strong className="text-foreground">Google Gemini</strong> — AI
                schedule generation.{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Privacy Policy ↗
                </a>
              </li>
              <li className="text-foreground-muted text-[0.875rem]">
                <strong className="text-foreground">MyAnimeList API</strong> — anime
                search and cover art. MAL does not receive any personal data from
                your AniPace session.
              </li>
            </ul>
          </Section>

          {/* Section 5 */}
          <Section title="5. Cookies & Tracking">
            <p>
              We do not use tracking cookies, advertising pixels, or third-party
              analytics. We use browser Local Storage for functional purposes only
              (keeping your plans available between sessions).
            </p>
          </Section>

          {/* Section 6 */}
          <Section title="6. Your Rights (GDPR & CCPA)">
            <p>
              Depending on where you are located, you may have the right to:
            </p>
            <ul className="flex flex-col gap-1.5 mt-2 pl-4 border-l border-border text-[0.875rem] text-foreground-muted">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your account and data</li>
              <li>Withdraw consent to email communications at any time</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at{" "}
              <a
                href="mailto:michaeloleonard2020@gmail.com"
                className="text-primary hover:underline"
              >
                michaeloleonard2020@gmail.com
              </a>
              .
            </p>
          </Section>

          {/* Section 7 */}
          <Section title="7. Data Retention">
            <p>
              Account data is retained for as long as your account is active. If
              you request deletion, all server-side data associated with your
              account is permanently removed within 30 days.
            </p>
            <p>
              Locally stored plans are controlled entirely by you and can be
              deleted by clearing your browser&apos;s Local Storage at any time.
            </p>
          </Section>

          {/* Section 8 */}
          <Section title="8. Changes to This Policy">
            <p>
              We may update this policy from time to time. The date at the top of
              this page will reflect the latest revision. Continued use of AniPace
              after changes are posted constitutes acceptance of the updated policy.
            </p>
          </Section>

          {/* Contact */}
          <div className="mt-4 p-5 rounded-[14px] bg-surface border border-border">
            <p className="text-[0.875rem] font-semibold text-foreground mb-1">
              Questions?
            </p>
            <p className="text-[0.875rem] text-foreground-muted">
              Reach out at{" "}
              <a
                href="mailto:michaeloleonard2020@gmail.com"
                className="text-primary hover:underline"
              >
                michaeloleonard2020@gmail.com
              </a>
              . We&apos;ll get back to you as soon as we can.
            </p>
          </div>
        </div>
      </article>
    </main>
  );
}

// ── Reusable section wrapper ─────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-[1rem] font-bold text-foreground mb-3">{title}</h2>
      <div className="flex flex-col gap-3 text-[0.9375rem] text-foreground-muted leading-relaxed">
        {children}
      </div>
    </section>
  );
}
