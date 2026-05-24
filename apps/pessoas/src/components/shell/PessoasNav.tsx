"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/pessoas", label: "Visão Geral", exact: true },
  { href: "/pessoas/colaboradores", label: "Colaboradores" },
  { href: "/pessoas/headcount", label: "Headcount" },
  { href: "/pessoas/escala", label: "Escala" },
  { href: "/pessoas/ponto", label: "Ponto" },
  { href: "/pessoas/ferias", label: "Férias" },
  { href: "/pessoas/faltas", label: "Faltas" },
  { href: "/pessoas/horas-extras", label: "HE" },
  { href: "/pessoas/disciplina", label: "Disciplina" },
  { href: "/pessoas/holerites", label: "Holerites" },
  { href: "/pessoas/gorjetas", label: "Gorjetas" },
  { href: "/pessoas/vale-transporte", label: "VT" },
  { href: "/pessoas/treinamentos", label: "Treinamentos" },
  { href: "/pessoas/avaliacoes", label: "Avaliações" },
  { href: "/pessoas/pdi", label: "PDI" },
  { href: "/pessoas/reunioes", label: "Reuniões" },
  { href: "/pessoas/organograma", label: "Organograma" },
  { href: "/pessoas/onboarding", label: "Onboarding" },
  { href: "/pessoas/feedback", label: "Feedback" },
  { href: "/pessoas/documentos", label: "Documentos" },
  { href: "/pessoas/importacao", label: "Importação" },
];

export function PessoasNav() {
  const pathname = usePathname();

  return (
    <nav
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
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "var(--text)",
          letterSpacing: 0.4,
          marginRight: 16,
          whiteSpace: "nowrap",
        }}
      >
        KPH Pessoas
      </span>
      {LINKS.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            style={{
              fontSize: 13,
              fontWeight: active ? 600 : 400,
              color: active ? "var(--text)" : "var(--text-3)",
              padding: "0 10px",
              height: "100%",
              display: "flex",
              alignItems: "center",
              borderBottom: active ? "2px solid var(--brand, currentColor)" : "2px solid transparent",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
