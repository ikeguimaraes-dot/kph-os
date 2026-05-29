"use client";

import type { AdocaoData, TopPath, WauPoint, RecentVisit } from "./actions";

export function AdocaoClient({ data }: { data: AdocaoData | null }) {
  if (!data) {
    return (
      <MigrationBanner />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Totalizador */}
      <div
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        }}
      >
        <StatCard label="Visualizações (30d)" value={String(data.total_views_30d)} />
        <StatCard
          label="WAU (semana atual)"
          value={String(data.wau[data.wau.length - 1]?.active_users ?? 0)}
        />
        <StatCard label="Módulos distintos" value={String(data.top_paths.length)} />
      </div>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "1fr 1fr",
        }}
      >
        {/* Top 5 módulos */}
        <TopPathsCard paths={data.top_paths} total={data.total_views_30d} />

        {/* WAU últimas 4 semanas */}
        <WauCard points={data.wau} />
      </div>

      {/* Visitas recentes */}
      <RecentTable visits={data.recent} />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 14,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "var(--text-3)",
          textTransform: "uppercase",
          letterSpacing: 0.6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 700,
          color: "var(--text)",
          marginTop: 4,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function TopPathsCard({ paths, total }: { paths: TopPath[]; total: number }) {
  const max = paths[0]?.count ?? 1;
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "var(--text)",
          marginBottom: 14,
        }}
      >
        Top 5 módulos (últimos 30d)
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {paths.length === 0 ? (
          <p style={{ fontSize: 12, color: "var(--text-3)" }}>
            Nenhuma visita registrada ainda.
          </p>
        ) : (
          paths.map((p, i) => (
            <PathRow key={p.path} rank={i + 1} path={p} max={max} total={total} />
          ))
        )}
      </div>
    </div>
  );
}

function PathRow({
  rank,
  path,
  max,
  total,
}: {
  rank: number;
  path: TopPath;
  max: number;
  total: number;
}) {
  const pct = Math.round((path.count / Math.max(max, 1)) * 100);
  const shareTotal = total > 0 ? Math.round((path.count / total) * 100) : 0;
  const label = path.path.replace("/inteligencia", "").replace(/^\//, "") || "Início";

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 4,
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "var(--text-3)",
              minWidth: 14,
            }}
          >
            {rank}.
          </span>
          <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 500 }}>
            {label || "/"}
          </span>
        </div>
        <span
          style={{
            fontSize: 11,
            color: "var(--text-2)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {path.count}×{" "}
          <span style={{ color: "var(--text-3)" }}>({shareTotal}%)</span>
        </span>
      </div>
      <div
        style={{
          height: 4,
          background: "var(--surface-2)",
          borderRadius: 99,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: "var(--brand)",
            borderRadius: 99,
          }}
        />
      </div>
    </div>
  );
}

function WauCard({ points }: { points: WauPoint[] }) {
  const max = Math.max(...points.map((p) => p.active_users), 1);

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "var(--text)",
          marginBottom: 14,
        }}
      >
        Usuários ativos semanais (WAU)
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
          alignItems: "end",
          height: 120,
        }}
      >
        {points.map((p) => {
          const barH = Math.max(8, Math.round((p.active_users / max) * 100));
          const isLast = p === points[points.length - 1];
          return (
            <div
              key={p.week_start}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 4,
                height: "100%",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: isLast ? "var(--brand)" : "var(--text)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {p.active_users}
              </span>
              <div
                style={{
                  width: "100%",
                  height: `${barH}%`,
                  background: isLast
                    ? "var(--brand)"
                    : "rgba(212,165,116,0.25)",
                  borderRadius: "4px 4px 0 0",
                  minHeight: 8,
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  color: isLast ? "var(--brand)" : "var(--text-3)",
                  fontWeight: isLast ? 700 : 400,
                  whiteSpace: "nowrap",
                }}
              >
                {p.week_label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecentTable({ visits }: { visits: RecentVisit[] }) {
  if (visits.length === 0) return null;
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
        Visitas recentes
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["Módulo", "Usuário", "Data/hora"].map((h) => (
              <th
                key={h}
                style={{
                  padding: "8px 16px",
                  textAlign: "left",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-3)",
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visits.map((v, i) => {
            const label = v.path.replace("/inteligencia", "").replace(/^\//, "") || "Início";
            const dt = new Date(v.visited_at);
            const dtStr = `${dt.toLocaleDateString("pt-BR")} ${dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
            return (
              <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                <td
                  style={{
                    padding: "8px 16px",
                    fontSize: 12,
                    color: "var(--text)",
                    fontWeight: 500,
                  }}
                >
                  {label || "/"}
                </td>
                <td
                  style={{
                    padding: "8px 16px",
                    fontSize: 11,
                    color: "var(--text-3)",
                    fontFamily: "var(--font-geist-mono)",
                  }}
                >
                  {v.user_email}
                </td>
                <td
                  style={{
                    padding: "8px 16px",
                    fontSize: 11,
                    color: "var(--text-3)",
                    fontVariantNumeric: "tabular-nums",
                    whiteSpace: "nowrap",
                  }}
                >
                  {dtStr}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

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
      <p style={{ fontSize: 12, color: "var(--text-3)", margin: "0 0 14px", lineHeight: 1.6 }}>
        A tabela <code>page_views</code> ainda não existe no banco. Execute o SQL abaixo no Supabase SQL Editor:
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
        {`CREATE TABLE IF NOT EXISTS public.page_views (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  path        text        NOT NULL,
  visited_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_page_views_path    ON public.page_views(path);
CREATE INDEX IF NOT EXISTS idx_page_views_user    ON public.page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_page_views_visited ON public.page_views(visited_at DESC);
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own" ON public.page_views FOR SELECT
  USING (user_id = auth.uid() OR kph_is_founder_or_cfo());
CREATE POLICY "insert_own" ON public.page_views FOR INSERT
  WITH CHECK (user_id = auth.uid());`}
      </pre>
    </div>
  );
}
