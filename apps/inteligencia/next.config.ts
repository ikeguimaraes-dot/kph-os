import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Multi-zone: o shell (kph-os.vercel.app) proxia /inteligencia/* para este
  // app — os assets precisam do prefixo para resolver através do proxy.
  assetPrefix: process.env.VERCEL ? "/inteligencia" : undefined,
  // Pacotes do workspace são fonte TS — transpilar no build do app.
  transpilePackages: ["@kph/db", "@kph/ui", "@kph/auth", "@kph/core"],
  // Raiz do monorepo — sem isso o Turbopack infere a raiz a partir de
  // lockfiles fora do repo e quebra a resolução de módulos.
  turbopack: { root: path.join(import.meta.dirname, "../..") },
};

export default nextConfig;
