"use client";

import { useCallback, useRef, useState, useMemo } from "react";
import {
  FileBarChart2, Upload, ChevronUp, ChevronDown, X,
  AlertTriangle, AlertCircle,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface PontoRow {
  matricula: string;
  nome: string;
  cpf: string;
  cargo: string;
  data_admissao: string;
  departamento: string;
  periodo: string;
  adicional_noturno: string;
  afastamentos_horas: string;
  afastamentos_dias: number;
  banco_horas_acumulado: string;
  banco_horas_mes: string;
  compensacao_bh: string;
  confraternizacao: string;
  falta_injustificada_horas: string;
  falta_injustificada_dias: number;
  ferias_horas: string;
  ferias_dias: number;
  feriados_dias: number;
  folga_domingo: string;
  folga_feriado: string;
  horas_previstas: string;
  horas_trabalhadas: string;
  horas_negativas: string;
  horas_positivas: string;
  inss_horas: string;
  inss_dias: number;
  licenca_paternidade_horas: string;
  licenca_paternidade_dias: number;
  saldo: string;
  abonado: string;
  abonado_dias: number;
  atestado_medico: string;
  regime: string;
  demissao: string;
  nascimento: string;
  filial: string;
  is_total: boolean;
}

type SortKey = keyof PontoRow;
type SortDir = "asc" | "desc";

// ── CSV parser ────────────────────────────────────────────────────────────────

function parsePontoCSV(text: string): PontoRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) return [];

  const rows: PontoRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const cols = line.split(";");
    if (cols.length < 5) continue;

    const g = (idx: number) => (cols[idx] ?? "").trim();
    const n = (idx: number) => {
      const v = parseInt(g(idx), 10);
      return isNaN(v) ? 0 : v;
    };

    rows.push({
      matricula: g(0),
      nome: g(1),
      cpf: g(2),
      cargo: g(3),
      data_admissao: g(4),
      demissao: g(5),
      nascimento: g(6),
      departamento: g(7),
      filial: g(8),
      regime: g(9),
      abonado: g(10),
      abonado_dias: n(11),
      atestado_medico: g(12),
      adicional_noturno: g(13),
      afastamentos_horas: g(14),
      afastamentos_dias: n(15),
      banco_horas_acumulado: g(16),
      banco_horas_mes: g(17),
      compensacao_bh: g(18),
      confraternizacao: g(19),
      falta_injustificada_horas: g(20),
      falta_injustificada_dias: n(21),
      ferias_horas: g(22),
      ferias_dias: n(23),
      feriados_dias: n(24),
      folga_domingo: g(25),
      folga_feriado: g(26),
      horas_previstas: g(27),
      horas_trabalhadas: g(28),
      horas_negativas: g(29),
      horas_positivas: g(30),
      inss_horas: g(31),
      inss_dias: n(32),
      licenca_paternidade_horas: g(33),
      licenca_paternidade_dias: n(34),
      periodo: g(35),
      saldo: g(36),
      is_total: g(0) === "",
    });
  }

  return rows;
}

// ── Time math helpers ─────────────────────────────────────────────────────────

function hhmm2min(s: string): number {
  if (!s) return 0;
  const clean = s.replace(/:00$/, "");
  const parts = clean.split(":").map(Number);
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  if (isNaN(h)) return 0;
  return (h || 0) * 60 + (m || 0);
}

function min2hhhmm(total: number): string {
  const h = Math.floor(Math.abs(total) / 60);
  const m = Math.abs(total) % 60;
  const sign = total < 0 ? "-" : "";
  return `${sign}${String(h).padStart(3, "0")}:${String(m).padStart(2, "0")}`;
}

function isNegHours(s: string): boolean {
  if (!s || s === "00:00" || s === "00:00:00") return false;
  return true;
}

// ── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, warn, danger,
}: {
  label: string;
  value: string | number;
  sub?: string;
  warn?: boolean;
  danger?: boolean;
}) {
  const bg = danger
    ? "rgba(239,68,68,0.08)"
    : warn
    ? "rgba(245,158,11,0.08)"
    : "var(--surface)";
  const color = danger ? "#DC2626" : warn ? "#A16207" : "var(--text)";
  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${danger ? "rgba(239,68,68,0.25)" : warn ? "rgba(245,158,11,0.25)" : "var(--border)"}`,
        borderRadius: 10,
        padding: "14px 16px",
      }}
    >
      <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 6, lineHeight: 1.3 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>{sub}</div>
      )}
    </div>
  );
}

// ── Sortable header ───────────────────────────────────────────────────────────

function Th({
  label, sortKey, current, dir, onSort, style,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey | null;
  dir: SortDir;
  onSort: (k: SortKey) => void;
  style?: React.CSSProperties;
}) {
  const active = current === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      style={{
        cursor: "pointer",
        userSelect: "none",
        padding: "9px 12px",
        fontSize: 11,
        fontWeight: 700,
        color: active ? "var(--brand)" : "var(--text-3)",
        textTransform: "uppercase",
        letterSpacing: 0.8,
        whiteSpace: "nowrap",
        background: "var(--surface-2)",
        borderBottom: "1px solid var(--border)",
        textAlign: "left",
        ...style,
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
        {label}
        {active ? (
          dir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />
        ) : (
          <ChevronDown size={12} style={{ opacity: 0.3 }} />
        )}
      </span>
    </th>
  );
}

// ── Detail drawer ─────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string | number }) {
  if (!value && value !== 0) return null;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 8,
        padding: "5px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span style={{ fontSize: 12, color: "var(--text-3)", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          color: "var(--text-3)",
          marginBottom: 8,
          paddingBottom: 4,
          borderBottom: "2px solid var(--brand-soft)",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function Drawer({ row, onClose }: { row: PontoRow; onClose: () => void }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 40,
        }}
      />
      <aside
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, width: 400,
          background: "var(--surface)", borderLeft: "1px solid var(--border)",
          zIndex: 41, overflowY: "auto", padding: "24px 20px",
          display: "flex", flexDirection: "column", gap: 0,
        }}
      >
        <div
          style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "flex-start", marginBottom: 20,
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
              {row.nome || "Totais"}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
              {row.cargo}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-3)", padding: 4, borderRadius: 6,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <DrawerSection title="Identificação">
          <DetailRow label="Matrícula" value={row.matricula} />
          <DetailRow label="CPF" value={row.cpf} />
          <DetailRow label="Cargo" value={row.cargo} />
          <DetailRow label="Admissão" value={row.data_admissao} />
          <DetailRow label="Departamento" value={row.departamento} />
          <DetailRow label="Filial" value={row.filial} />
          <DetailRow label="Regime" value={row.regime} />
          {row.demissao && <DetailRow label="Demissão" value={row.demissao} />}
          {row.nascimento && <DetailRow label="Nascimento" value={row.nascimento} />}
        </DrawerSection>

        <DrawerSection title="Período">
          <DetailRow label="Período" value={row.periodo} />
          <DetailRow label="Horas Previstas" value={row.horas_previstas} />
          <DetailRow label="Horas Trabalhadas" value={row.horas_trabalhadas} />
          <DetailRow label="Horas Negativas" value={row.horas_negativas} />
          <DetailRow label="Horas Positivas" value={row.horas_positivas} />
          <DetailRow label="Saldo" value={row.saldo} />
        </DrawerSection>

        <DrawerSection title="Banco de Horas">
          <DetailRow label="Acumulado" value={row.banco_horas_acumulado} />
          <DetailRow label="No Mês" value={row.banco_horas_mes} />
          <DetailRow label="Compensação BH" value={row.compensacao_bh} />
        </DrawerSection>

        <DrawerSection title="Ausências">
          <DetailRow label="Falta Injustificada (h)" value={row.falta_injustificada_horas} />
          <DetailRow label="Falta Injustificada (dias)" value={row.falta_injustificada_dias || ""} />
          <DetailRow label="Atestado Médico" value={row.atestado_medico} />
          <DetailRow label="Abonado (h)" value={row.abonado} />
          <DetailRow label="Abonado (dias)" value={row.abonado_dias || ""} />
          <DetailRow label="Afastamentos (h)" value={row.afastamentos_horas} />
          <DetailRow label="Afastamentos (dias)" value={row.afastamentos_dias || ""} />
          <DetailRow label="INSS (h)" value={row.inss_horas} />
          <DetailRow label="INSS (dias)" value={row.inss_dias || ""} />
          <DetailRow label="Férias (h)" value={row.ferias_horas} />
          <DetailRow label="Férias (dias)" value={row.ferias_dias || ""} />
          <DetailRow label="Licença Paternidade (h)" value={row.licenca_paternidade_horas} />
          <DetailRow label="Licença Paternidade (dias)" value={row.licenca_paternidade_dias || ""} />
        </DrawerSection>

        <DrawerSection title="Extras">
          <DetailRow label="Adicional Noturno" value={row.adicional_noturno} />
          <DetailRow label="Folga Domingo" value={row.folga_domingo} />
          <DetailRow label="Folga Feriado" value={row.folga_feriado} />
          <DetailRow label="Feriados (dias)" value={row.feriados_dias || ""} />
          <DetailRow label="Confraternização" value={row.confraternizacao} />
        </DrawerSection>
      </aside>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function RelatorioPontoPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<PontoRow[]>([]);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey | null>("nome");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("Todos");
  const [selected, setSelected] = useState<PontoRow | null>(null);

  const parseFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parsePontoCSV(text);
      setRows(parsed);
      setFileName(file.name);
      setSortKey("nome");
      setSortDir("asc");
      setSearch("");
      setDeptFilter("Todos");
    };
    reader.readAsText(file, "ISO-8859-1");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) parseFile(file);
    },
    [parseFile],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) parseFile(file);
    },
    [parseFile],
  );

  // ── Derived data

  const colaboradores = rows.filter((r) => !r.is_total);
  const totalRow = rows.find((r) => r.is_total);
  const periodo = colaboradores[0]?.periodo ?? "";

  const totalTrabalhadas = useMemo(
    () => colaboradores.reduce((s, r) => s + hhmm2min(r.horas_trabalhadas), 0),
    [colaboradores],
  );
  const totalPrevistas = useMemo(
    () => colaboradores.reduce((s, r) => s + hhmm2min(r.horas_previstas), 0),
    [colaboradores],
  );
  const totalFaltas = useMemo(
    () => colaboradores.reduce((s, r) => s + r.falta_injustificada_dias, 0),
    [colaboradores],
  );
  const pctCumprimento =
    totalPrevistas > 0 ? ((totalTrabalhadas / totalPrevistas) * 100).toFixed(1) : "—";

  const comFaltas = colaboradores.filter((r) => r.falta_injustificada_dias > 0);
  const comNegativas = colaboradores.filter((r) => isNegHours(r.horas_negativas));

  // ── Departments

  const deptos = useMemo(() => {
    const s = new Set(colaboradores.map((r) => r.departamento).filter(Boolean));
    return ["Todos", ...Array.from(s).sort()];
  }, [colaboradores]);

  // ── Sorting + filtering

  const handleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("asc"); }
  };

  const filtered = useMemo(() => {
    let list = colaboradores;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.nome.toLowerCase().includes(q));
    }
    if (deptFilter !== "Todos") {
      list = list.filter((r) => r.departamento === deptFilter);
    }
    if (sortKey) {
      list = [...list].sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        let cmp = 0;
        if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
        else cmp = String(av).localeCompare(String(bv), "pt-BR");
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return list;
  }, [colaboradores, search, deptFilter, sortKey, sortDir]);

  const thProps = { current: sortKey, dir: sortDir, onSort: handleSort };

  // ── Percentage cell color

  function pctColor(worked: string, previsto: string) {
    const w = hhmm2min(worked);
    const p = hhmm2min(previsto);
    if (p === 0) return "var(--text-3)";
    const pct = (w / p) * 100;
    if (pct >= 95) return "#16A34A";
    if (pct >= 80) return "#A16207";
    return "#DC2626";
  }

  function pctValue(worked: string, previsto: string) {
    const w = hhmm2min(worked);
    const p = hhmm2min(previsto);
    if (p === 0) return "—";
    return ((w / p) * 100).toFixed(1) + "%";
  }

  function saldoColor(saldo: string) {
    if (!saldo || saldo === "00:00" || saldo === "00:00:00") return "var(--text-3)";
    if (saldo.startsWith("-")) return "#DC2626";
    return "#16A34A";
  }

  // ── Render

  const hasData = rows.length > 0;

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      {/* Header */}
      <header style={{ marginBottom: 22 }}>
        <div
          style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 1.6,
            textTransform: "uppercase", color: "var(--text-3)",
          }}
        >
          Pessoas · Relatório de Ponto
        </div>
        <h1
          style={{
            fontSize: 26, fontWeight: 700, margin: "6px 0 0",
            color: "var(--text)", letterSpacing: -0.4,
            display: "flex", alignItems: "center", gap: 10,
          }}
        >
          <FileBarChart2 size={22} style={{ color: "var(--brand)" }} />
          Relatório de Ponto
        </h1>
      </header>

      {/* Drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragging ? "var(--brand)" : "var(--border-strong)"}`,
          borderRadius: 12,
          padding: hasData ? "14px 20px" : "48px 24px",
          textAlign: "center",
          cursor: "pointer",
          background: dragging ? "var(--brand-soft)" : "var(--surface)",
          transition: "border-color 0.15s, background 0.15s",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: hasData ? "row" : "column",
          gap: 12,
        }}
      >
        <Upload
          size={hasData ? 18 : 28}
          style={{ color: dragging ? "var(--brand)" : "var(--text-3)", flexShrink: 0 }}
        />
        <div>
          <div
            style={{
              fontWeight: 600,
              color: "var(--text)",
              fontSize: hasData ? 14 : 16,
            }}
          >
            {hasData
              ? (fileName ?? "CSV carregado")
              : "Arraste o CSV do Totvs aqui ou clique para selecionar"}
          </div>
          {!hasData && (
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>
              Aceita arquivos .csv exportados do Totvs (ISO-8859-1)
            </div>
          )}
          {hasData && (
            <div style={{ fontSize: 12, color: "var(--text-3)" }}>
              Clique para carregar outro arquivo
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>

      {hasData && (
        <>
          {/* KPIs */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 14,
              marginBottom: 20,
            }}
          >
            <KpiCard label="Colaboradores" value={colaboradores.length} />
            <KpiCard
              label="H. Trabalhadas (total)"
              value={min2hhhmm(totalTrabalhadas)}
            />
            <KpiCard
              label="H. Previstas (total)"
              value={min2hhhmm(totalPrevistas)}
            />
            <KpiCard
              label="% Cumprimento"
              value={pctCumprimento + (pctCumprimento !== "—" ? "%" : "")}
              warn={
                pctCumprimento !== "—" && parseFloat(pctCumprimento) < 80
              }
              danger={
                pctCumprimento !== "—" && parseFloat(pctCumprimento) < 70
              }
            />
            <KpiCard
              label="Faltas Injustificadas"
              value={totalFaltas + " dias"}
              danger={totalFaltas > 0}
            />
            <KpiCard label="Período" value={periodo || "—"} />
          </div>

          {/* Alertas */}
          {comFaltas.length > 0 && (
            <div
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 10,
                padding: "12px 16px",
                marginBottom: 12,
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
              }}
            >
              <AlertCircle size={16} style={{ color: "#DC2626", flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#DC2626", marginBottom: 4 }}>
                  Faltas injustificadas detectadas
                </div>
                <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.7 }}>
                  {comFaltas.map((r) => `${r.nome} (${r.falta_injustificada_dias} dia${r.falta_injustificada_dias > 1 ? "s" : ""})`).join(" · ")}
                </div>
              </div>
            </div>
          )}

          {comNegativas.length > 0 && (
            <div
              style={{
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.3)",
                borderRadius: 10,
                padding: "12px 16px",
                marginBottom: 12,
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
              }}
            >
              <AlertTriangle size={16} style={{ color: "#A16207", flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#A16207", marginBottom: 4 }}>
                  Horas negativas no mês
                </div>
                <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.7 }}>
                  {comNegativas.map((r) => `${r.nome} (${r.horas_negativas})`).join(" · ")}
                </div>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
              marginBottom: 8,
              padding: "10px 14px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 10,
            }}
          >
            <input
              type="text"
              placeholder="Buscar colaborador…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: "1 1 200px",
                padding: "7px 10px",
                fontSize: 13,
                border: "1px solid var(--border)",
                borderRadius: 7,
                background: "var(--surface-2)",
                color: "var(--text)",
                outline: "none",
              }}
            />
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              style={{
                padding: "7px 10px",
                fontSize: 13,
                border: "1px solid var(--border)",
                borderRadius: 7,
                background: "var(--surface-2)",
                color: "var(--text)",
                cursor: "pointer",
              }}
            >
              {deptos.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            {(search || deptFilter !== "Todos") && (
              <button
                onClick={() => { setSearch(""); setDeptFilter("Todos"); }}
                style={{
                  padding: "7px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  border: "1px solid var(--border)",
                  borderRadius: 7,
                  background: "var(--surface-2)",
                  color: "var(--text-3)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <X size={12} /> Limpar filtros
              </button>
            )}
            <span style={{ fontSize: 12, color: "var(--text-3)", marginLeft: "auto" }}>
              {colaboradores[0]?.filial || "—"} · {periodo} · {filtered.length} registro{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Tabela */}
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    <Th label="Colaborador" sortKey="nome" {...thProps} style={{ minWidth: 180 }} />
                    <Th label="Depto" sortKey="departamento" {...thProps} />
                    <Th label="H. Prev." sortKey="horas_previstas" {...thProps} />
                    <Th label="H. Trab." sortKey="horas_trabalhadas" {...thProps} />
                    <Th label="%" sortKey="horas_trabalhadas" {...thProps} />
                    <Th label="H. Pos." sortKey="horas_positivas" {...thProps} />
                    <Th label="H. Neg." sortKey="horas_negativas" {...thProps} />
                    <Th label="Faltas" sortKey="falta_injustificada_dias" {...thProps} />
                    <Th label="Banco Ac." sortKey="banco_horas_acumulado" {...thProps} />
                    <Th label="Saldo" sortKey="saldo" {...thProps} />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <tr
                      key={row.matricula + i}
                      onClick={() => setSelected(row)}
                      style={{
                        cursor: "pointer",
                        background: i % 2 === 0 ? "var(--surface)" : "var(--surface-2)",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "var(--surface-3)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = i % 2 === 0 ? "var(--surface)" : "var(--surface-2)")
                      }
                    >
                      <td style={{ padding: "9px 12px", borderBottom: "1px solid var(--border)" }}>
                        <div style={{ fontWeight: 600, color: "var(--text)" }}>{row.nome}</div>
                        <div style={{ fontSize: 11, color: "var(--text-3)" }}>{row.cargo}</div>
                      </td>
                      <td style={{ padding: "9px 12px", borderBottom: "1px solid var(--border)", color: "var(--text-2)", whiteSpace: "nowrap" }}>
                        {row.departamento}
                      </td>
                      <td style={{ padding: "9px 12px", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums", color: "var(--text-2)" }}>
                        {row.horas_previstas}
                      </td>
                      <td style={{ padding: "9px 12px", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums", color: "var(--text-2)" }}>
                        {row.horas_trabalhadas}
                      </td>
                      <td style={{ padding: "9px 12px", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums", fontWeight: 700, color: pctColor(row.horas_trabalhadas, row.horas_previstas) }}>
                        {pctValue(row.horas_trabalhadas, row.horas_previstas)}
                      </td>
                      <td style={{ padding: "9px 12px", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums", color: "var(--text-2)" }}>
                        {row.horas_positivas}
                      </td>
                      <td style={{ padding: "9px 12px", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums", color: isNegHours(row.horas_negativas) ? "#DC2626" : "var(--text-3)" }}>
                        {row.horas_negativas || "—"}
                      </td>
                      <td style={{ padding: "9px 12px", borderBottom: "1px solid var(--border)", textAlign: "center", fontWeight: row.falta_injustificada_dias > 0 ? 700 : 400, color: row.falta_injustificada_dias > 0 ? "#DC2626" : "var(--text-3)" }}>
                        {row.falta_injustificada_dias || "—"}
                      </td>
                      <td style={{ padding: "9px 12px", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums", color: "var(--text-2)" }}>
                        {row.banco_horas_acumulado}
                      </td>
                      <td style={{ padding: "9px 12px", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums", fontWeight: 600, color: saldoColor(row.saldo) }}>
                        {row.saldo || "—"}
                      </td>
                    </tr>
                  ))}

                  {/* Linha de totais */}
                  {totalRow && (
                    <tr
                      onClick={() => setSelected(totalRow)}
                      style={{
                        cursor: "pointer",
                        background: "var(--surface-3)",
                        fontWeight: 700,
                      }}
                    >
                      <td style={{ padding: "10px 12px" }} colSpan={1}>
                        <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 12, letterSpacing: 0.5 }}>
                          TOTAIS
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px" }} />
                      <td style={{ padding: "10px 12px", fontVariantNumeric: "tabular-nums" }}>
                        {totalRow.horas_previstas}
                      </td>
                      <td style={{ padding: "10px 12px", fontVariantNumeric: "tabular-nums" }}>
                        {totalRow.horas_trabalhadas}
                      </td>
                      <td style={{ padding: "10px 12px" }} />
                      <td style={{ padding: "10px 12px", fontVariantNumeric: "tabular-nums" }}>
                        {totalRow.horas_positivas}
                      </td>
                      <td style={{ padding: "10px 12px", fontVariantNumeric: "tabular-nums", color: isNegHours(totalRow.horas_negativas) ? "#DC2626" : "var(--text-3)" }}>
                        {totalRow.horas_negativas || "—"}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        {totalRow.falta_injustificada_dias || "—"}
                      </td>
                      <td style={{ padding: "10px 12px", fontVariantNumeric: "tabular-nums" }}>
                        {totalRow.banco_horas_acumulado}
                      </td>
                      <td style={{ padding: "10px 12px", fontVariantNumeric: "tabular-nums", color: saldoColor(totalRow.saldo) }}>
                        {totalRow.saldo || "—"}
                      </td>
                    </tr>
                  )}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={10} style={{ padding: "32px", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
                        Nenhum resultado encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Drawer */}
      {selected && <Drawer row={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
