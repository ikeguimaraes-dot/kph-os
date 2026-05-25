const nextConfig = {
  transpilePackages: ["@kph/db", "@kph/ui", "@kph/auth"],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
