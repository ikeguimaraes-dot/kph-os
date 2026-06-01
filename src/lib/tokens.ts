/**
 * KPH Design System — Tokens semânticos
 * Paleta oficial: Carvão · Creme · Brasa · Pedra · Ouro
 * Importar este arquivo em todos os client components que usam severidade.
 */

// ─── Cores base ───────────────────────────────────────────────────────────────

export const COLORS = {
  carvao: "#1A1A1A",
  creme:  "#F5F0E8",
  brasa:  "#C4622D",
  pedra:  "#8A8278",
  ouro:   "#B8975A",
} as const;

// ─── Tokens semânticos de severidade ─────────────────────────────────────────
// Substituem o palette paralelo Tailwind (verde #15803D / âmbar #A16207 / vermelho #B91C1C)
// que estava espalhado por todo o codebase.

export type Severity = "ok" | "warn" | "danger" | "neutral";

export const SEV: Record<Severity, { fg: string; bg: string }> = {
  ok:      { fg: COLORS.ouro,   bg: "rgba(184,151,90,0.14)" },
  warn:    { fg: "#A16207",     bg: "rgba(245,158,11,0.14)" }, // âmbar — fora do palette KPH mas aceito para "atenção"
  danger:  { fg: COLORS.brasa,  bg: "rgba(196,98,45,0.14)" },
  neutral: { fg: COLORS.pedra,  bg: "rgba(138,130,120,0.12)" },
};

// Atalhos de uso frequente
export const SEV_BG: Record<Severity, string> = {
  ok:      SEV.ok.bg,
  warn:    SEV.warn.bg,
  danger:  SEV.danger.bg,
  neutral: SEV.neutral.bg,
};

export const SEV_FG: Record<Severity, string> = {
  ok:      SEV.ok.fg,
  warn:    SEV.warn.fg,
  danger:  SEV.danger.fg,
  neutral: SEV.neutral.fg,
};

// ─── Tokens para semáforo de metas ───────────────────────────────────────────

export type SemaforoStatus = "ok" | "alerta" | "ruim" | "sem_dados";

export const SEMAFORO: Record<SemaforoStatus, { fg: string; bg: string; icon: string; label: string }> = {
  ok:       { fg: COLORS.ouro,   bg: "rgba(184,151,90,0.14)",   icon: "✓", label: "Meta atingida" },
  alerta:   { fg: "#A16207",     bg: "rgba(245,158,11,0.14)",   icon: "!", label: "Atenção necessária" },
  ruim:     { fg: COLORS.brasa,  bg: "rgba(196,98,45,0.14)",    icon: "✕", label: "Abaixo da meta" },
  sem_dados:{ fg: COLORS.pedra,  bg: "rgba(138,130,120,0.12)",  icon: "—", label: "Sem dados" },
};

// ─── Cores de job type para o Orquestrador ───────────────────────────────────

export const JOB_COLORS: Record<string, string> = {
  deployment:        COLORS.ouro,    // evento de valor — entrega
  code_review:       COLORS.pedra,   // processo neutro
  qa_playwright:     COLORS.pedra,   // operacional
  data_sync:         COLORS.pedra,   // operacional
  alert_generated:   COLORS.brasa,   // atenção
  feedback_received: "#A16207",      // âmbar — input do usuário
  insight_generated: COLORS.ouro,    // valor gerado
};

// ─── maxWidth padrão do container de conteúdo ────────────────────────────────
export const CONTENT_MAX_WIDTH = 1180;
