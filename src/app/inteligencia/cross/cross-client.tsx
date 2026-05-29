"use client";

import { useRouter } from "next/navigation";
import { TrendingDown, TrendingUp } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kph/ui/select";
import { formatBRL, formatPct } from "@/lib/metas/types";
import type { CrossKpiRow, CrossPayload } from "@/lib/inteligencia/cross";

export function CrossClient({
  payload,
  periodo,
  periodoOptions,
}: {
  payload: CrossPayload | null;
  periodo: string;
  periodoOptions: string[];
}) {
  const router = useRouter();

  function changePeriodo(p: string | null) {
    if (!p || p === periodo) return;
    router.push(`/inteligencia/cross?periodo=${encodeURIComponent(p)}`);
  }

  return (
    <>
      {/* Period selector */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <Select value={periodo} onValueChange={changePeriodo}>
          <SelectTrigger style={{ minWidth: 150 }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periodoOptions.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {payload && (
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>
            Delta vs{" "}
            <strong style={{ color: "var(--text-2)" }}>
              {payload.periodo_anterior}
            </strong>
          </span>
        )}
      </div>

      {!payload || payload.rows.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* KPI header rows */}
          <KpiGrid rows={payload.rows} />
        </>
      )}
    </>
  );
}

// ── KPI Grid ──────────────────────────────────────────────────────

const KPIS: {
  key: keyof CrossKpiRow;
  deltaKey: keyof CrossKpiRow;
  label: string;
  fmt: (v: number | null) => string;
  /** true = maior é melhor, false = menor é melhor */
  higherBetter: boolean;
}[] = [
  {
    key: "receita",
    deltaKey: "delta_receita",
    label: "Receita",
    fmt: formatBRL,
    higherBetter: true,
  },
  {
    key: "cmv_pct",
    deltaKey: "delta_cmv_pct",
    label: "CMV %",
    fmt: formatPct,
    higherBetter: false,
  },
  {
    key: "prime_cost_pct",
    deltaKey: "delta_prime_cost_pct",
    label: "Prime cost %",
    fmt: formatPct,
    higherBetter: false,
  },
  {
    key: "ebitda_pct",
    deltaKey: "delta_ebitda_pct",
    label: "EBITDA %",
    fmt: formatPct,
    higherBetter: true,
  },
];

function KpiGrid({ rows }: { rows: CrossKpiRow[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {KPIS.map((kpi) => (
        <section key={kpi.key as string}>
          {/* KPI label */}
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: "var(--text-3)",
              marginBottom: 8,
            }}
          >
            {kpi.label}
          </div>
          {/* Brand cards side-by-side */}
          <div
            style={{
              display: "grid",
              gap: 10,
              gridTemplateColumns: `repeat(${Math.min(rows.length, 4)}, minmax(200px, 1fr))`,
            }}
          >
            {rows.map((r) => (
              <BrandKpiCard
                key={r.brand_id}
                row={r}
                kpi={kpi}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function BrandKpiCard({
  row,
  kpi,
}: {
  row: CrossKpiRow;
  kpi: (typeof KPIS)[number];
}) {
  const value = row[kpi.key] as number | null;
  const delta = row[kpi.deltaKey] as number | null;

  // Delta positivo + higherBetter → bom (verde). Delta positivo + lowerBetter → ruim (vermelho).
  const deltaGood =
    delta == null ? null : kpi.higherBetter ? delta > 0 : delta < 0;

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 14,
      }}
    >
      {/* Brand header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 99,
            background: row.brand_color ?? "var(--text-3)",
            display: "inline-block",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-2)",
            textTransform: "uppercase",
            letterSpacing: 0.6,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {row.brand_name}
        </span>
      </div>

      {/* Value */}
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "var(--text)",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1.1,
        }}
      >
        {kpi.fmt(value)}
      </div>

      {/* Delta badge */}
      {delta != null && delta !== 0 ? (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            marginTop: 6,
            fontSize: 11,
            fontWeight: 700,
            color: deltaGood === true ? "#15803D" : deltaGood === false ? "#B91C1C" : "var(--text-3)",
            background:
              deltaGood === true
                ? "rgba(34,197,94,0.12)"
                : deltaGood === false
                ? "rgba(239,68,68,0.12)"
                : "var(--surface-2)",
            padding: "2px 6px",
            borderRadius: 99,
          }}
        >
          {deltaGood === true ? (
            <TrendingUp size={10} />
          ) : (
            <TrendingDown size={10} />
          )}
          {delta > 0 ? "+" : ""}
          {kpi.key === "receita" || kpi.key === "delta_receita"
            ? formatBRL(delta)
            : `${delta.toFixed(1).replace(".", ",")}pp`}
          {" "}MoM
        </div>
      ) : delta === 0 ? (
        <div
          style={{
            marginTop: 6,
            fontSize: 11,
            color: "var(--text-3)",
          }}
        >
          Sem variação
        </div>
      ) : (
        <div
          style={{
            marginTop: 6,
            fontSize: 11,
            color: "var(--text-3)",
          }}
        >
          Sem dado anterior
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        padding: "56px 20px",
        textAlign: "center",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--text)",
          marginBottom: 6,
        }}
      >
        Sem dados financeiros para {"{periodo}"}
      </div>
      <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0 }}>
        Registre lançamentos no módulo Financeiro para este período aparecer aqui.
      </p>
    </div>
  );
}
