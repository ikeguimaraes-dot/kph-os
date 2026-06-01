"use client";

import { useState, useTransition } from "react";
import {
  submitFeedback,
  cycleStatus,
  type FeedbackItem,
  type FeedbackType,
  type FeedbackPriority,
  type FeedbackStatus,
} from "./actions";

const MODULES = [
  "Dashboard",
  "Operação",
  "Compras",
  "Financeiro",
  "Pessoas",
  "Comercial",
  "Marca",
  "Metas",
  "WBR",
  "Cross-módulo",
  "Adoção",
  "Orquestrador",
];

const TYPE_LABELS: Record<FeedbackType, string> = {
  bug: "Bug",
  suggestion: "Sugestão",
  other: "Outro",
};

const PRIORITY_LABELS: Record<FeedbackPriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  open: "Aberto",
  triaged: "Triado",
  resolved: "Resolvido",
};

const STATUS_BG: Record<FeedbackStatus, string> = {
  open: "rgba(239,68,68,0.14)",
  triaged: "rgba(245,158,11,0.14)",
  resolved: "rgba(34,197,94,0.14)",
};

const STATUS_FG: Record<FeedbackStatus, string> = {
  open: "#B91C1C",
  triaged: "#A16207",
  resolved: "#15803D",
};

const PRIORITY_FG: Record<FeedbackPriority, string> = {
  low: "var(--text-3)",
  medium: "#A16207",
  high: "#B91C1C",
};

export function FeedbackClient({
  initialItems,
  isFounder,
}: {
  initialItems: FeedbackItem[] | null;
  isFounder: boolean;
}) {
  const [items, setItems] = useState<FeedbackItem[]>(initialItems ?? []);
  const tableVisible = initialItems !== null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <FeedbackForm
        onSubmit={(newItem) => setItems((prev) => [newItem, ...prev])}
        tableVisible={tableVisible}
      />
      {tableVisible ? (
        <FeedbackTable items={items} isFounder={isFounder} onUpdate={setItems} />
      ) : (
        <MigrationBanner />
      )}
    </div>
  );
}

// ── Form ────────────────────────────────────────────────────────────

function FeedbackForm({
  onSubmit,
  tableVisible,
}: {
  onSubmit: (item: FeedbackItem) => void;
  tableVisible: boolean;
}) {
  const [type, setType] = useState<FeedbackType>("bug");
  const [module, setModule] = useState<string>(MODULES[0] ?? "Dashboard");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<FeedbackPriority>("medium");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (description.trim().length < 20) {
      setError("Descrição deve ter pelo menos 20 caracteres.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const result = await submitFeedback({ type, module, description, priority });
        // optimistically add to table
        const newItem: FeedbackItem = {
          id: result.id,
          user_id: null,
          type,
          module,
          description,
          priority,
          status: "open",
          created_at: new Date().toISOString(),
        };
        if (tableVisible) onSubmit(newItem);
        setDescription("");
        setType("bug");
        setModule(MODULES[0] ?? "Dashboard");
        setPriority("medium");
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao enviar feedback.");
      }
    });
  }

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 20,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "var(--text)",
          marginBottom: 16,
        }}
      >
        Reportar bug ou sugestão
      </div>

      <form onSubmit={handleSubmit}>
        {/* Row 1: Type + Module + Priority */}
        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "auto 1fr auto",
            marginBottom: 12,
          }}
        >
          {/* Type selector */}
          <div style={{ display: "flex", gap: 4 }}>
            {(["bug", "suggestion", "other"] as FeedbackType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "5px 12px",
                  borderRadius: 8,
                  border: "1px solid",
                  borderColor: type === t ? "var(--brand)" : "var(--border)",
                  background: type === t ? "var(--brand-soft)" : "transparent",
                  color: type === t ? "var(--brand)" : "var(--text-3)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          {/* Module dropdown */}
          <select
            value={module}
            onChange={(e) => setModule(e.target.value)}
            style={{
              fontSize: 12,
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface-2)",
              color: "var(--text)",
              width: "100%",
            }}
          >
            {MODULES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Priority selector */}
          <div style={{ display: "flex", gap: 4 }}>
            {(["low", "medium", "high"] as FeedbackPriority[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "5px 10px",
                  borderRadius: 8,
                  border: "1px solid",
                  borderColor: priority === p ? PRIORITY_FG[p] : "var(--border)",
                  background:
                    priority === p ? `${PRIORITY_FG[p]}18` : "transparent",
                  color: priority === p ? PRIORITY_FG[p] : "var(--text-3)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {PRIORITY_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva o bug ou sugestão (mínimo 20 caracteres)…"
          required
          rows={4}
          style={{
            width: "100%",
            fontSize: 13,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--surface-2)",
            color: "var(--text)",
            resize: "vertical",
            fontFamily: "inherit",
            boxSizing: "border-box",
            marginBottom: 12,
          }}
        />

        {error && (
          <div
            style={{
              fontSize: 12,
              color: "#B91C1C",
              background: "rgba(239,68,68,0.10)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 6,
              padding: "6px 10px",
              marginBottom: 10,
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              fontSize: 12,
              color: "#15803D",
              background: "rgba(34,197,94,0.10)",
              border: "1px solid rgba(34,197,94,0.25)",
              borderRadius: 6,
              padding: "6px 10px",
              marginBottom: 10,
            }}
          >
            Feedback enviado com sucesso.
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="submit"
            disabled={isPending}
            style={{
              fontSize: 13,
              fontWeight: 600,
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              background: isPending ? "var(--surface-2)" : "var(--brand)",
              color: isPending ? "var(--text-3)" : "#fff",
              cursor: isPending ? "not-allowed" : "pointer",
            }}
          >
            {isPending ? "Enviando…" : "Enviar feedback"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Table ───────────────────────────────────────────────────────────

function FeedbackTable({
  items,
  isFounder,
  onUpdate,
}: {
  items: FeedbackItem[];
  isFounder: boolean;
  onUpdate: (items: FeedbackItem[]) => void;
}) {
  const [cycling, setCycling] = useState<string | null>(null);

  async function handleCycle(id: string) {
    setCycling(id);
    try {
      await cycleStatus(id);
      const next: Record<FeedbackStatus, FeedbackStatus> = {
        open: "triaged",
        triaged: "resolved",
        resolved: "open",
      };
      onUpdate(
        items.map((item) =>
          item.id === id ? { ...item, status: next[item.status] } : item,
        ),
      );
    } finally {
      setCycling(null);
    }
  }

  if (items.length === 0) {
    return (
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "32px 16px",
          textAlign: "center",
          fontSize: 13,
          color: "var(--text-3)",
        }}
      >
        Nenhum feedback registrado ainda.
      </div>
    );
  }

  return (
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
        Histórico de feedback ({items.length})
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["Data", "Módulo", "Tipo", "Descrição", "Prioridade", "Status"].map(
              (h) => (
                <th
                  key={h}
                  style={{
                    padding: "8px 12px",
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
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const dt = new Date(item.created_at);
            const dtStr = dt.toLocaleDateString("pt-BR");
            const desc =
              item.description.length > 80
                ? item.description.slice(0, 80) + "…"
                : item.description;

            return (
              <tr
                key={item.id}
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <td
                  style={{
                    padding: "8px 12px",
                    fontSize: 11,
                    color: "var(--text-3)",
                    whiteSpace: "nowrap",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {dtStr}
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    fontSize: 12,
                    color: "var(--text-2)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.module}
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    fontSize: 11,
                    color: "var(--text-3)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {TYPE_LABELS[item.type]}
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    fontSize: 12,
                    color: "var(--text)",
                    maxWidth: 280,
                  }}
                >
                  {desc}
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    fontSize: 11,
                    fontWeight: 600,
                    color: PRIORITY_FG[item.priority],
                    whiteSpace: "nowrap",
                  }}
                >
                  {PRIORITY_LABELS[item.priority]}
                </td>
                <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
                  {isFounder ? (
                    <button
                      type="button"
                      disabled={cycling === item.id}
                      onClick={() => void handleCycle(item.id)}
                      title="Clique para avançar status"
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: 99,
                        background: STATUS_BG[item.status],
                        color: STATUS_FG[item.status],
                        border: "none",
                        cursor: cycling === item.id ? "not-allowed" : "pointer",
                        opacity: cycling === item.id ? 0.6 : 1,
                      }}
                    >
                      {STATUS_LABELS[item.status]}
                    </button>
                  ) : (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: 99,
                        background: STATUS_BG[item.status],
                        color: STATUS_FG[item.status],
                        display: "inline-block",
                      }}
                    >
                      {STATUS_LABELS[item.status]}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Migration banner ─────────────────────────────────────────────────

function MigrationBanner() {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px dashed var(--border)",
        borderRadius: 14,
        padding: "32px 28px",
        textAlign: "center",
        maxWidth: 520,
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 12 }} aria-hidden="true">💬</div>
      <h3
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "var(--text)",
          margin: "0 0 8px",
          fontFamily: "var(--font-fraunces, serif)",
        }}
      >
        Histórico de feedbacks indisponível
      </h3>
      <p
        style={{
          fontSize: 12,
          color: "var(--text-3)",
          lineHeight: 1.65,
          margin: 0,
        }}
      >
        Esta funcionalidade está sendo ativada. O formulário acima está disponível
        para novos envios. Entre em contato com a equipe de engenharia para
        ativar o histórico completo.
      </p>
    </div>
  );
}
