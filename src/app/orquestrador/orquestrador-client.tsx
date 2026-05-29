"use client";

import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Clock,
  Database,
  GitPullRequest,
  MessageSquare,
  RefreshCw,
  Rocket,
  Sparkles,
  XCircle,
} from "lucide-react";
import type { HosJob, JobStatus, JobType } from "@/lib/inteligencia/orquestrador";

// ── Job type config ────────────────────────────────────────────────

type JobTypeConfig = {
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
};

const JOB_TYPE_CONFIG: Record<JobType, JobTypeConfig> = {
  deploy_prod: {
    label: "Deploy produção",
    icon: <Rocket size={14} />,
    color: "#15803D",
    bg: "rgba(34,197,94,0.14)",
  },
  code_review: {
    label: "Code review",
    icon: <GitPullRequest size={14} />,
    color: "#6B5BDB",
    bg: "rgba(107,91,219,0.14)",
  },
  qa_preview: {
    label: "QA preview",
    icon: <CircleDot size={14} />,
    color: "#0369A1",
    bg: "rgba(3,105,161,0.14)",
  },
  data_sync: {
    label: "Sincronização de dados",
    icon: <Database size={14} />,
    color: "#0369A1",
    bg: "rgba(3,105,161,0.14)",
  },
  alert_generated: {
    label: "Alerta gerado",
    icon: <AlertTriangle size={14} />,
    color: "#B91C1C",
    bg: "rgba(239,68,68,0.14)",
  },
  feedback_received: {
    label: "Feedback recebido",
    icon: <MessageSquare size={14} />,
    color: "#A16207",
    bg: "rgba(245,158,11,0.14)",
  },
  insight_generated: {
    label: "Insight gerado",
    icon: <Sparkles size={14} />,
    color: "#7C3AED",
    bg: "rgba(124,58,237,0.14)",
  },
};

const FALLBACK_CONFIG: JobTypeConfig = {
  label: "Job",
  icon: <RefreshCw size={14} />,
  color: "var(--text-3)",
  bg: "var(--surface-2)",
};

// ── Status config ──────────────────────────────────────────────────

type StatusConfig = { label: string; icon: React.ReactNode; color: string };

const STATUS_CONFIG: Record<JobStatus, StatusConfig> = {
  pending: {
    label: "Aguardando",
    icon: <Clock size={12} />,
    color: "var(--text-3)",
  },
  running: {
    label: "Executando",
    icon: <RefreshCw size={12} />,
    color: "#0369A1",
  },
  success: {
    label: "Sucesso",
    icon: <CheckCircle2 size={12} />,
    color: "#15803D",
  },
  error: {
    label: "Erro",
    icon: <XCircle size={12} />,
    color: "#B91C1C",
  },
};

// ── Main component ─────────────────────────────────────────────────

export function OrquestradorClient({ jobs }: { jobs: HosJob[] | null }) {
  if (jobs === null) {
    return (
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 28,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
          Tabela hos_jobs não encontrada
        </div>
        <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0, lineHeight: 1.6 }}>
          A tabela <code>hos_jobs</code> ainda não existe ou não está acessível.
          Verifique a migration 033 no Supabase.
        </p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div
        style={{
          padding: "40px 16px",
          textAlign: "center",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          fontSize: 13,
          color: "var(--text-3)",
        }}
      >
        Nenhum job registrado ainda.
      </div>
    );
  }

  // Group by type for summary
  const byType = new Map<string, number>();
  for (const job of jobs) {
    byType.set(job.type, (byType.get(job.type) ?? 0) + 1);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Summary pills */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {Array.from(byType.entries()).map(([type, count]) => {
          const cfg = JOB_TYPE_CONFIG[type as JobType] ?? FALLBACK_CONFIG;
          return (
            <div
              key={type}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: 99,
                background: cfg.bg,
                color: cfg.color,
                border: `1px solid ${cfg.color}30`,
              }}
            >
              {cfg.icon}
              {cfg.label}
              <span
                style={{
                  fontVariantNumeric: "tabular-nums",
                  fontWeight: 700,
                }}
              >
                ×{count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Job list */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid var(--border)",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text)",
          }}
        >
          Execuções recentes ({jobs.length})
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Tipo", "Status", "Payload", "Data"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "8px 14px",
                    textAlign: "left",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--text-3)",
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                    borderBottom: "1px solid var(--border)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function JobRow({ job }: { job: HosJob }) {
  const typeCfg = JOB_TYPE_CONFIG[job.type] ?? FALLBACK_CONFIG;
  const statusCfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.pending;
  const dt = new Date(job.created_at);
  const dtStr = `${dt.toLocaleDateString("pt-BR")} ${dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

  const payloadStr = job.payload
    ? Object.entries(job.payload)
        .map(([k, v]) => `${k}: ${String(v)}`)
        .join(" · ")
        .slice(0, 60)
    : "—";

  return (
    <tr style={{ borderBottom: "1px solid var(--border)" }}>
      {/* Type */}
      <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: 8,
            background: typeCfg.bg,
            color: typeCfg.color,
          }}
        >
          {typeCfg.icon}
          {typeCfg.label}
        </div>
      </td>

      {/* Status */}
      <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            fontWeight: 600,
            color: statusCfg.color,
          }}
        >
          {statusCfg.icon}
          {statusCfg.label}
        </div>
      </td>

      {/* Payload */}
      <td
        style={{
          padding: "10px 14px",
          fontSize: 11,
          color: "var(--text-3)",
          fontFamily: "var(--font-geist-mono)",
          maxWidth: 280,
        }}
      >
        {payloadStr}
      </td>

      {/* Date */}
      <td
        style={{
          padding: "10px 14px",
          fontSize: 11,
          color: "var(--text-3)",
          whiteSpace: "nowrap",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {dtStr}
      </td>
    </tr>
  );
}
