"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DollarSign, Search, Star, TrendingUp } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBRL } from "@/lib/format";
import type { TipsRecordWithEmployee } from "@/types/pessoas";

const MESES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export function GorjetasClient({
  unitName,
  records,
  defaultMes,
  defaultAno,
}: {
  unitName: string;
  records: TipsRecordWithEmployee[];
  defaultMes: number;
  defaultAno: number;
}) {
  const [search, setSearch] = useState("");

  const counts = useMemo(
    () => ({
      total: records.length,
      totalPontos: records.reduce((acc, r) => acc + r.pontos_liquidos, 0),
      mediaValorPonto:
        records.length > 0
          ? records.reduce((acc, r) => acc + Number(r.valor_ponto), 0) /
            records.length
          : 0,
    }),
    [records],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => {
      const name = r.employee
        ? `${r.employee.nome} ${r.employee.sobrenome}`.toLowerCase()
        : "";
      return name.includes(q);
    });
  }, [records, search]);

  return (
    <div>
      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 14,
          marginBottom: 22,
        }}
      >
        <KpiCard
          icon={<Star size={18} />}
          label="Registros no período"
          value={counts.total}
        />
        <KpiCard
          icon={<TrendingUp size={18} />}
          label="Total de pontos líquidos"
          value={counts.totalPontos.toLocaleString("pt-BR")}
        />
        <KpiCard
          icon={<DollarSign size={18} />}
          label="Valor médio do ponto"
          value={formatBRL(counts.mediaValorPonto)}
        />
      </div>

      {/* Filtros */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", minWidth: 240, flex: 1 }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-3)",
              pointerEvents: "none",
            }}
          />
          <Input
            placeholder="Buscar por colaborador…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 30 }}
          />
        </div>
        <div style={{ fontSize: 12, color: "var(--text-3)", marginLeft: "auto" }}>
          {unitName} · {MESES[defaultMes - 1]}/{defaultAno} · {filtered.length}{" "}
          registro{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Tabela */}
      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "var(--text-3)",
            fontSize: 13,
            background: "var(--surface)",
            border: "1px dashed var(--border)",
            borderRadius: 8,
          }}
        >
          Nenhum registro para o filtro atual.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Colaborador</TableHead>
              <TableHead>Período</TableHead>
              <TableHead className="text-right">Valor/Ponto</TableHead>
              <TableHead className="text-right">Total Pontos</TableHead>
              <TableHead className="text-right">Abatimento</TableHead>
              <TableHead className="text-right">Pontos Líq.</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => {
              const name = r.employee
                ? `${r.employee.nome} ${r.employee.sobrenome}`.trim()
                : "—";
              const valorTotal = r.pontos_liquidos * Number(r.valor_ponto);
              const periodoLabel = (() => {
                const d = new Date(`${r.periodo}T00:00:00`);
                if (Number.isNaN(d.getTime())) return r.periodo;
                return `${MESES[d.getMonth()]}/${d.getFullYear()}`;
              })();
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    {r.employee ? (
                      <Link
                        href={`/pessoas/colaboradores/${r.employee_id}`}
                        style={{
                          fontWeight: 600,
                          color: "var(--text)",
                          textDecoration: "none",
                        }}
                      >
                        {name}
                      </Link>
                    ) : (
                      <span style={{ color: "var(--text-3)" }}>—</span>
                    )}
                    {r.employee?.funcao && (
                      <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                        {r.employee.funcao}
                      </div>
                    )}
                  </TableCell>
                  <TableCell style={{ color: "var(--text-2)" }}>
                    {periodoLabel}
                  </TableCell>
                  <TableCell
                    className="text-right"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {formatBRL(r.valor_ponto)}
                  </TableCell>
                  <TableCell
                    className="text-right"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {r.total_pontos.toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell
                    className="text-right"
                    style={{
                      fontVariantNumeric: "tabular-nums",
                      color: "var(--text-3)",
                    }}
                  >
                    {r.abatimento_pontos > 0
                      ? `−${r.abatimento_pontos.toLocaleString("pt-BR")}`
                      : "—"}
                  </TableCell>
                  <TableCell
                    className="text-right"
                    style={{
                      fontVariantNumeric: "tabular-nums",
                      fontWeight: 700,
                      color: "var(--brand)",
                    }}
                  >
                    {r.pontos_liquidos.toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell
                    className="text-right"
                    style={{
                      fontVariantNumeric: "tabular-nums",
                      fontWeight: 600,
                    }}
                  >
                    {formatBRL(valorTotal)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: 16,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 99,
          background: "var(--brand-soft)",
          color: "var(--brand)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 11, color: "var(--text-3)" }}>{label}</div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "var(--text)",
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
            marginTop: 2,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
