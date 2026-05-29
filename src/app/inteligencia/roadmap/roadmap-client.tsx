"use client";

import { useState } from "react";
import type { RoadmapItem, RoadmapStatus } from "./actions";

const STATUS_COLS: { status: RoadmapStatus; label: string }[] = [
  { status: "backlog", label: "Backlog" },
  { status: "in_progress", label: "Em progresso" },
  { status: "done", label: "Entregue" },
];

const STATUS_ACCENT: Record<RoadmapStatus, string> = {
  backlog: "var(--border)",
  in_progress: "#D4A574",
  done: "#22C55E",
};

const SPRINT_COLORS = ["#6B8FA3", "#D4A574", "#A07CC5", "#4A7C59"];

export function RoadmapClient({ items }: { items: RoadmapItem[] | null }) {
  if (items === null) return <MigrationBanner />;

  const byStatus = (status: RoadmapStatus) =>
    items.filter((i) => i.status === status);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16,
        alignItems: "start",
      }}
    >
      {STATUS_COLS.map(({ status, label }) => (
        <KanbanColumn
          key={status}
          label={label}
          status={status}
          items={byStatus(status)}
        />
      ))}
    </div>
  );
}

function KanbanColumn({
  label,
  status,
  items,
}: {
  label: string;
  status: RoadmapStatus;
  items: RoadmapItem[];
}) {
  return (
    <div>
      {/* Column header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: STATUS_ACCENT[status],
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--text-2)",
            textTransform: "uppercase",
            letterSpacing: 0.8,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-3)",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 99,
            padding: "1px 7px",
          }}
        >
          {items.length}
        </span>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.length === 0 ? (
          <div
            style={{
              padding: "20px 12px",
              textAlign: "center",
              fontSize: 12,
              color: "var(--text-3)",
              background: "var(--surface)",
              border: "1px dashed var(--border)",
              borderRadius: 10,
            }}
          >
            Nenhum item
          </div>
        ) : (
          items.map((item) => <RoadmapCard key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}

function RoadmapCard({ item }: { item: RoadmapItem }) {
  const [expanded, setExpanded] = useState(false);
  const isDone = item.status === "done";
  const sprintColor = SPRINT_COLORS[(item.sprint - 1) % SPRINT_COLORS.length] ?? "#D4A574";

  return (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderLeft: isDone
          ? `3px solid ${STATUS_ACCENT.done}`
          : "1px solid var(--border)",
        borderRadius: 10,
        padding: "12px 14px",
        cursor: "pointer",
        paddingLeft: isDone ? 12 : 14,
      }}
    >
      {/* Tags row */}
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          marginBottom: 8,
        }}
      >
        {/* Sprint badge */}
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: "2px 7px",
            borderRadius: 99,
            background: `${sprintColor}20`,
            color: sprintColor,
            border: `1px solid ${sprintColor}40`,
          }}
        >
          Sprint {item.sprint}
        </span>

        {/* Module pill */}
        {item.module && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: "2px 7px",
              borderRadius: 99,
              background: "rgba(212,165,116,0.14)",
              color: "#A16207",
              border: "1px solid rgba(212,165,116,0.30)",
            }}
          >
            {item.module}
          </span>
        )}
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: isDone ? "var(--text-2)" : "var(--text)",
          lineHeight: 1.4,
          textDecoration: isDone ? "line-through" : "none",
          textDecorationColor: "var(--text-3)",
        }}
      >
        {item.title}
      </div>

      {/* Expanded description */}
      {expanded && item.description && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: "1px solid var(--border)",
            fontSize: 12,
            color: "var(--text-3)",
            lineHeight: 1.55,
          }}
        >
          {item.description}
        </div>
      )}

      {/* Expand hint */}
      <div
        style={{
          marginTop: 8,
          fontSize: 10,
          color: "var(--text-3)",
          opacity: 0.7,
        }}
      >
        {expanded ? "▲ recolher" : "▼ ver detalhes"}
      </div>
    </button>
  );
}

// ── Migration banner ──────────────────────────────────────────────

function MigrationBanner() {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 28,
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "var(--text)",
          marginBottom: 8,
        }}
      >
        Migration pendente
      </div>
      <p
        style={{
          fontSize: 12,
          color: "var(--text-3)",
          margin: "0 0 14px",
          lineHeight: 1.6,
        }}
      >
        A tabela <code>roadmap_items</code> ainda não existe. Execute o SQL abaixo no Supabase SQL Editor e depois rode o seed para popular com os sprints:
      </p>
      <pre
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: 14,
          fontSize: 11,
          color: "var(--text-2)",
          overflowX: "auto",
          lineHeight: 1.7,
        }}
      >
        {`CREATE TABLE IF NOT EXISTS public.roadmap_items (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text        NOT NULL,
  description text,
  sprint      int         NOT NULL,
  status      text        NOT NULL DEFAULT 'backlog'
              CHECK (status IN ('backlog','in_progress','done')),
  module      text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_roadmap" ON public.roadmap_items FOR SELECT USING (true);
CREATE POLICY "manage_roadmap" ON public.roadmap_items FOR ALL
  USING (kph_is_founder_or_cfo()) WITH CHECK (kph_is_founder_or_cfo());

-- Seed: Sprint 1 (done)
INSERT INTO public.roadmap_items (title,description,sprint,status,module) VALUES
('Diagnóstico receita R$0 no WBR','WBR exibia R$0,00 de receita. Causa: sem lançamentos na semana. Solução: campo receita_mensal_dre + banner de aviso.',1,'done','WBR'),
('Detalhes de alertas críticos no WBR','Expandido para mostrar tipo, mensagem e data de cada alerta com painel colapsável.',1,'done','WBR'),
('Configuração de metas por marca','Adicionado badge "Configurar" para linhas sem meta na página /metas.',1,'done','Metas'),
('Breakdown de headcount no WBR','Adicionado breakdown por departamento com expansão inline no card de marca.',1,'done','WBR'),
-- Sprint 2 (done)
('Cross-módulo — comparativo por marca','Página /cross com seletor de período, grid de KPIs por marca e badges de delta MoM.',2,'done','Cross-módulo'),
('Adoção da plataforma','Página /adocao com page_views, top 5 módulos, WAU semanal e visitas recentes.',2,'done','Adoção'),
('Trend chart 8 semanas no WBR','LineChart recharts abaixo dos cards. Uma linha por marca, X=semana, Y=receita BRL.',2,'done','WBR'),
-- Sprint 3 (in_progress)
('Bugs & Feedback','Formulário de bugs/sugestões com tipo, módulo, prioridade e tabela com status cycling.',3,'in_progress','Bugs & Feedback'),
('Roadmap — kanban de sprints','Kanban estático com 3 colunas e cards expansíveis por sprint.',3,'in_progress','Roadmap'),
('Orquestrador — novos tipos de job','Ícones e cores para data_sync, alert_generated, feedback_received, insight_generated.',3,'in_progress','Orquestrador');`}
      </pre>
    </div>
  );
}
