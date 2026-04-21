import { Coffee } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer className="px-6 pt-8 pb-12 border-t border-border">
      <div className="flex flex-col gap-3 text-[0.8125rem] text-foreground-muted">
        <a
          href="https://www.instagram.com/themichaelleonard/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors w-fit"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
          </svg>
          Follow on Instagram
        </a>

        <a
          href="https://buymeacoffee.com/themichaelleonard"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors w-fit"
        >
          <Coffee size={14} aria-hidden />
          Support AniPace
        </a>

        <p>Built for people who love anime but never have time to watch it.</p>
        <p className="text-foreground-muted/40">© 2025 AniPace</p>
      </div>
    </footer>
  );
}
