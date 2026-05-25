import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@kph/db", "@kph/ui", "@kph/auth"],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
