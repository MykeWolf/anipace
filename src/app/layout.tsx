import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AniPace — Plan Your Anime Watch",
  description:
    "Turn overwhelming episode counts into a realistic day-by-day watching schedule. Pick your anime, tell us your schedule, and we'll build a plan that fits your real life.",
  keywords: ["anime", "schedule", "planner", "watching plan", "anime tracker"],
  openGraph: {
    title: "AniPace — Plan Your Anime Watch",
    description:
      "Built for adults who love anime but never have time to watch it.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${syne.variable} scroll-smooth`}>
      <body className="antialiased bg-background text-foreground">
        {/*
          Mobile-first: full width up to 480px, then centered on wider screens.
          Outer bg (#121212) fills the rest of the viewport on desktop.
        */}
        <div className="mx-auto w-full max-w-[480px] md:max-w-3xl lg:max-w-5xl min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
