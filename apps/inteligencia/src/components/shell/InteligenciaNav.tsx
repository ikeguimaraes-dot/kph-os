"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/inteligencia", label: "Visão Geral", exact: true },
  { href: "/inteligencia/adocao", label: "Adoção", exact: true },
  { href: "/inteligencia/cross", label: "Cross", exact: true },
  { href: "/inteligencia/feedback", label: "Feedback", exact: true },
  { href: "/inteligencia/metas", label: "Metas" },
  { href: "/inteligencia/roadmap", label: "Roadmap", exact: true },
  { href: "/inteligencia/wbr", label: "WBR", exact: true },
];

const SEPARATOR_BEFORE = "/orquestrador";

const EXTRA_LINKS = [
  { href: "/orquestrador", label: "Orquestrador", exact: true },
];

export function InteligenciaNav() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <nav
      aria-label="Navegação do módulo Inteligência"
      style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        padding: "0 24px",
        display: "flex",
        gap: 4,
        alignItems: "center",
        height: 48,
        overflowX: "auto",
      }}
    >
      {/* Brand — clicável, navega para o Dashboard raiz */}
      <Link
        href="/inteligencia"
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "var(--text)",
          letterSpacing: 0.4,
          marginRight: 16,
          whiteSpace: "nowrap",
          textDecoration: "none",
          fontFamily: "var(--font-instrument-sans, inherit)",
        }}
      >
        KPH Inteligência
      </Link>

      {LINKS.map(({ href, label, exact }) => {
        const active = isActive(href, exact);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            style={{
              fontSize: 13,
              fontWeight: active ? 600 : 400,
              color: active ? "var(--text)" : "var(--text-3)",
              padding: "0 10px",
              height: "100%",
              display: "flex",
              alignItems: "center",
              borderBottom: active ? "2px solid var(--brand, #C4622D)" : "2px solid transparent",
              textDecoration: "none",
              whiteSpace: "nowrap",
              fontFamily: "var(--font-instrument-sans, inherit)",
            }}
          >
            {label}
          </Link>
        );
      })}

      {/* Separador visual antes do Orquestrador */}
      <span
        aria-hidden="true"
        style={{
          width: 1,
          height: 20,
          background: "var(--border)",
          margin: "0 8px",
          flexShrink: 0,
        }}
      />

      {EXTRA_LINKS.map(({ href, label, exact }) => {
        const active = isActive(href, exact);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            style={{
              fontSize: 13,
              fontWeight: active ? 600 : 400,
              color: active ? "var(--text)" : "var(--text-3)",
              padding: "0 10px",
              height: "100%",
              display: "flex",
              alignItems: "center",
              borderBottom: active ? "2px solid var(--brand, #C4622D)" : "2px solid transparent",
              textDecoration: "none",
              whiteSpace: "nowrap",
              fontFamily: "var(--font-instrument-sans, inherit)",
            }}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

// Suprime warning de unused var no TS
void SEPARATOR_BEFORE;
