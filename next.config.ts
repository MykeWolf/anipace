import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*"],
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
    ],
  },
};

export default nextConfig;
