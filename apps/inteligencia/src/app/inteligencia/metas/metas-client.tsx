"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Target } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kph/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kph/ui/table";
import {
  SEMAFORO_COLOR,
  classifySemaforo,
  formatBRL,
  formatPct,
  pctAtingimento,
  toNumber,
  type BrandTargetWithRealizado,
  type KpiDirection,
  type SemaforoStatus,
} from "@/lib/metas/types";

export function MetasClient({
  rows,
  periodo,
  periodoOptions,
}: {
  rows: BrandTargetWithRealizado[];
  periodo: string;
  periodoOptions: string[];
}) {
  const router = useRouter();

  function changePeriodo(p: string | null) {
    if (!p || p === periodo) return;
    router.push(`/inteligencia/metas?periodo=${encodeURIComponent(p)}`);
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          marginBottom: 14,
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
        <span
          style={{
            fontSize: 11,
            color: "var(--text-3)",
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
            marginLeft: "auto",
          }}
        >
          <Legend status="ok" label="Atingiu" />
          <Legend status="alerta" label="Próximo" />
          <Legend status="ruim" label="Abaixo" />
          <Legend status="sem_dados" label="Sem dados" />
        </span>
      </div>

      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 12,
            background: "var(--surface)",
            overflow: "auto",
          }}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Marca</TableHead>
                <TableHead>Receita</TableHead>
                <TableHead>CMV %</TableHead>
                <TableHead>Prime cost %</TableHead>
                <TableHead>Ticket médio</TableHead>
                <TableHead>NPS</TableHead>
                <TableHead>Headcount</TableHead>
                <TableHead>Eventos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const t = r.target;
                return (
                  <TableRow
                    key={r.brand_id}
                    onClick={() =>
                      router.push(
                        `/inteligencia/metas/${r.brand_slug}?periodo=${encodeURIComponent(periodo)}`,
                      )
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <TableCell>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 99,
                            background: r.brand_color ?? "var(--text-3)",
                            display: "inline-block",
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--text)",
                          }}
                        >
                          {r.brand_name}
                        </span>
                        {!r.target && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                              fontSize: 10,
                              fontWeight: 600,
                              color: "var(--brand)",
                              padding: "1px 6px",
                              borderRadius: 99,
                              background: "var(--brand-soft)",
                              border: "1px solid var(--brand)",
                            }}
                          >
                            <Pencil size={9} />
                            Configurar
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <KpiCell
                      meta={toNumber(t?.receita_meta)}
                      realizado={r.realizado.receita_realizada}
                      formatFn={formatBRL}
                      direction="higher_better"
                    />
                    <KpiCell
                      meta={toNumber(t?.cmv_meta_pct)}
                      realizado={r.realizado.cmv_pct}
                      formatFn={formatPct}
                      direction="lower_better"
                    />
                    <KpiCell
                      meta={toNumber(t?.prime_cost_meta_pct)}
                      realizado={r.realizado.prime_cost_pct}
                      formatFn={formatPct}
                      direction="lower_better"
                    />
                    <KpiCell
                      meta={toNumber(t?.ticket_medio_meta)}
                      realizado={r.realizado.ticket_medio}
                      formatFn={formatBRL}
                      direction="higher_better"
                    />
                    <KpiCell
                      meta={toNumber(t?.nps_meta)}
                      realizado={r.realizado.nps}
                      formatFn={(v) =>
                        v == null ? "—" : (typeof v === "number" ? v : Number(v)).toFixed(0)
                      }
                      direction="higher_better"
                    />
                    <KpiCell
                      meta={t?.headcount_meta ?? null}
                      realizado={r.realizado.headcount}
                      formatFn={(v) => (v == null ? "—" : String(v))}
                      direction="higher_better"
                    />
                    <KpiCell
                      meta={t?.eventos_meta ?? null}
                      realizado={r.realizado.eventos}
                      formatFn={(v) => (v == null ? "—" : String(v))}
                      direction="higher_better"
                    />
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}

function KpiCell({
  meta,
  realizado,
  formatFn,
  direction,
}: {
  meta: number | null;
  realizado: number | null;
  formatFn: (v: string | number | null | undefined) => string;
  direction: KpiDirection;
}) {
  const status = classifySemaforo(meta, realizado, direction);
  const meta_pct =
    direction === "higher_better" ? pctAtingimento(meta, realizado) : null;
  const sem = SEMAFORO_COLOR[status];
  return (
    <TableCell style={{ minWidth: 110 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 700,
            color: sem.fg,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 99,
              background: sem.fg,
              display: "inline-block",
            }}
          />
          {formatFn(realizado)}
        </div>
        <div style={{ fontSize: 10, color: "var(--text-3)" }}>
          meta {formatFn(meta)}
          {meta_pct != null && (
            <>
              {" · "}
              <span style={{ color: sem.fg, fontWeight: 600 }}>
                {meta_pct}%
              </span>
            </>
          )}
        </div>
      </div>
    </TableCell>
  );
}

function Legend({ status, label }: { status: SemaforoStatus; label: string }) {
  const c = SEMAFORO_COLOR[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 99,
          background: c.fg,
          display: "inline-block",
        }}
      />
      {label}
    </span>
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
        maxWidth: 520,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 99,
          background: "var(--brand-soft)",
          color: "var(--brand)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 14px",
        }}
      >
        <Target size={20} />
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "var(--text)",
          fontFamily: "var(--font-fraunces, serif)",
          marginBottom: 8,
        }}
      >
        Sem metas, sem semáforo.
      </div>
      <p style={{ fontSize: 13, color: "var(--text-3)", margin: "0 0 16px", lineHeight: 1.65 }}>
        Defina a meta mensal de receita para Meet &amp; Eat e Madonna.
        Leva 2 minutos.
      </p>
      <Link
        href="/inteligencia/metas/configurar"
        style={{
          display: "inline-block",
          fontSize: 12,
          fontWeight: 600,
          color: "#C4622D",
          textDecoration: "none",
          border: "1px solid #C4622D",
          borderRadius: 8,
          padding: "6px 14px",
        }}
      >
        → Configurar metas
      </Link>
    </div>
  );
}
