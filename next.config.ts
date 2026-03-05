import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly list dev origins the preview tool uses (wildcard not supported)
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.myanimelist.net",
        pathname: "/images/**",
      },
      {
        // Jikan sometimes returns direct myanimelist.net image URLs
        protocol: "https",
        hostname: "myanimelist.net",
        pathname: "/images/**",
      },
      {
        // AniList cover images (fallback API)
        protocol: "https",
        hostname: "s4.anilist.co",
        pathname: "/file/**",
      },
    ],
  },
};

export default nextConfig;
