"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Clock, Loader2, Search, Timer, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateBR } from "@/lib/format";
import { approveOvertime } from "@/lib/pessoas/actions";
import type { OvertimeRecordWithEmployee } from "@/types/pessoas";

const TIPO_LABEL: Record<string, string> = { "50": "50%", "100": "100%", banco: "Banco" };
const TIPO_COLOR: Record<string, { bg: string; fg: string }> = {
  "50":  { bg: "rgba(59,130,246,0.16)",  fg: "#1D4ED8" },
  "100": { bg: "rgba(245,158,11,0.16)",  fg: "#A16207" },
  banco: { bg: "rgba(168,85,247,0.16)",  fg: "#7E22CE" },
};
const STATUS_COLOR = {
  pendente:  { bg: "rgba(100,116,139,0.14)", fg: "#475569", label: "Pendente" },
  aprovada:  { bg: "rgba(34,197,94,0.16)",   fg: "#15803D", label: "Aprovada" },
  rejeitada: { bg: "rgba(239,68,68,0.16)",   fg: "#B91C1C", label: "Rejeitada" },
};

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

export function HorasExtrasClient({
  unitName,
  records,
  defaultMes,
  defaultAno,
}: {
  unitName: string;
  records: OvertimeRecordWithEmployee[];
  defaultMes: number;
  defaultAno: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const counts = useMemo(() => ({
    totalHoras: records.reduce((acc, r) => acc + Number(r.hours), 0),
    pendentes: records.filter((r) => r.approved === null).length,
    aprovadas: records.filter((r) => r.approved === true).length,
  }), [records]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (tipoFilter !== "all" && r.type !== tipoFilter) return false;
      if (statusFilter === "pendente" && r.approved !== null) return false;
      if (statusFilter === "aprovada" && r.approved !== true) return false;
      if (statusFilter === "rejeitada" && r.approved !== false) return false;
      if (q) {
        const name = r.employee ? `${r.employee.nome} ${r.employee.sobrenome}`.toLowerCase() : "";
        if (!name.includes(q)) return false;
      }
      return true;
    });
  }, [records, tipoFilter, statusFilter, search]);

  function handleApprove(id: string, name: string) {
    if (!window.confirm(`Aprovar HE de ${name}?`)) return;
    setActingOn(id);
    startTransition(async () => {
      const r = await approveOvertime(id, true, null);
      setActingOn(null);
      if (!r.ok) { alert(`Falha: ${r.error}`); return; }
      router.refresh();
    });
  }

  function handleReject(id: string, name: string) {
    if (!window.confirm(`Rejeitar HE de ${name}?`)) return;
    setActingOn(id);
    startTransition(async () => {
      const r = await approveOvertime(id, false, null);
      setActingOn(null);
      if (!r.ok) { alert(`Falha: ${r.error}`); return; }
      router.refresh();
    });
  }

  return (
    <div>
      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 22 }}>
        <KpiCard icon={<Timer size={18} />} label="Total de horas" value={`${counts.totalHoras.toFixed(1)}h`} />
        <KpiCard icon={<Clock size={18} />} label="Pendentes de aprovação" value={counts.pendentes} highlight={counts.pendentes > 0} />
        <KpiCard icon={<Check size={18} />} label="Aprovadas" value={counts.aprovadas} />
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ position: "relative", minWidth: 240, flex: 1 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }} />
          <Input placeholder="Buscar por colaborador…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 30 }} />
        </div>
        <Select value={tipoFilter} onValueChange={(v) => setTipoFilter(v ?? "all")}>
          <SelectTrigger style={{ width: 160 }}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="50">50%</SelectItem>
            <SelectItem value="100">100%</SelectItem>
            <SelectItem value="banco">Banco de horas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger style={{ width: 160 }}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="aprovada">Aprovada</SelectItem>
            <SelectItem value="rejeitada">Rejeitada</SelectItem>
          </SelectContent>
        </Select>
        <div style={{ fontSize: 12, color: "var(--text-3)", marginLeft: "auto" }}>
          {unitName} · {MESES[defaultMes - 1]}/{defaultAno} · {filtered.length} registro{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Tabela */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-3)", fontSize: 13, background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: 8 }}>
          Nenhum registro para o filtro atual.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Colaborador</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Horas</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead style={{ textAlign: "right" }}>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => {
              const tipoCor = TIPO_COLOR[r.type] ?? { bg: "rgba(100,100,100,0.12)", fg: "var(--text-2)" };
              const statusKey = r.approved === null ? "pendente" : r.approved ? "aprovada" : "rejeitada";
              const statusCor = STATUS_COLOR[statusKey];
              const name = r.employee ? `${r.employee.nome} ${r.employee.sobrenome}`.trim() : "—";
              const acting = actingOn === r.id;
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    {r.employee ? (
                      <Link href={`/pessoas/colaboradores/${r.employee_id}`} style={{ fontWeight: 600, color: "var(--text)", textDecoration: "none" }}>
                        {name}
                      </Link>
                    ) : <span style={{ color: "var(--text-3)" }}>—</span>}
                    {r.employee?.funcao && <div style={{ fontSize: 11, color: "var(--text-3)" }}>{r.employee.funcao}</div>}
                  </TableCell>
                  <TableCell style={{ fontVariantNumeric: "tabular-nums" }}>{formatDateBR(r.date)}</TableCell>
                  <TableCell className="text-right" style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, color: "var(--brand)" }}>
                    {Number(r.hours).toFixed(1)}h
                  </TableCell>
                  <TableCell>
                    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 999, background: tipoCor.bg, color: tipoCor.fg, fontWeight: 600, fontSize: 11 }}>
                      {TIPO_LABEL[r.type] ?? r.type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 999, background: statusCor.bg, color: statusCor.fg, fontWeight: 600, fontSize: 11 }}>
                      {statusCor.label}
                    </span>
                  </TableCell>
                  <TableCell style={{ textAlign: "right" }}>
                    {r.approved === null ? (
                      <div style={{ display: "inline-flex", gap: 6, justifyContent: "flex-end" }}>
                        <Button size="sm" variant="outline" onClick={() => handleApprove(r.id, name)} disabled={pending} title="Aprovar">
                          {acting && pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" style={{ color: "#15803D" }} />}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleReject(r.id, name)} disabled={pending} title="Rejeitar">
                          <X className="h-3.5 w-3.5" style={{ color: "#B91C1C" }} />
                        </Button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: "var(--text-3)" }}>—</span>
                    )}
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

function KpiCard({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string | number; highlight?: boolean }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: 99, background: highlight ? "rgba(245,158,11,0.14)" : "var(--brand-soft)", color: highlight ? "#A16207" : "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 11, color: "var(--text-3)" }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", fontVariantNumeric: "tabular-nums", lineHeight: 1, marginTop: 2 }}>{value}</div>
      </div>
    </div>
  );
}
