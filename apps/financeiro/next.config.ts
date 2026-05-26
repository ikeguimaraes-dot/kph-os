import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@kph/db", "@kph/ui", "@kph/auth"],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // When accessed through the kph-os shell, static assets are proxied via
  // /financeiro/_next/*. assetPrefix ensures chunks are served from that path.
  assetPrefix: process.env.VERCEL ? "/financeiro" : undefined,
};

export default nextConfig;
