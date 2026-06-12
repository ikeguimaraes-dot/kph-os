"use client";

// Registra page views a cada mudança de rota — fire-and-forget.
// Inserido no InteligenciaLayout como client component filho.

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/app/inteligencia/adocao/actions";

export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Chamada sem await — não bloqueia nada, falhas são silenciosas
    void trackPageView(pathname);
  }, [pathname]);

  return null;
}
