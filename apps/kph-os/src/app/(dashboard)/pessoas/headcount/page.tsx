import { requireUser } from "@kph/auth/server";
import { createSupabaseServerClient } from "@kph/db/supabase/server";
import { InsightPanel } from "@/components/intelligence/InsightPanel";

export const dynamic = "force-dynamic";

type HeadcountRow = {
  brand_id?: string;
  brand_name?: string;
  headcount_ativo?: number;
  folha_bruta?: number;
  admissoes_mes?: number;
  demissoes_mes?: number;
};

async function getHeadcount(): Promise<HeadcountRow[]> {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return [];
    const { data } = await (supabase as any)
      .from("v_headcount_por_marca")
      .select("brand_id, brand_name, headcount_ativo, folha_bruta, admissoes_mes, demissoes_mes")
      .order("headcount_ativo", { ascending: false });
    return (data ?? []) as HeadcountRow[];
  } catch {
    return [];
  }
}

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export default async function HeadcountPage() {
  await requireUser();
  const rows = await getHeadcount();

  const totalAtivo = rows.reduce((s, r) => s + (r.headcount_ativo ?? 0), 0);
  const totalFolha = rows.reduce((s, r) => s + (r.folha_bruta ?? 0), 0);
  const totalAdmissoes = rows.reduce((s, r) => s + (r.admissoes_mes ?? 0), 0);
  const totalDemissoes = rows.reduce((s, r) => s + (r.demissoes_mes ?? 0), 0);
  const turnover = totalAtivo > 0 ? ((totalDemissoes / totalAtivo) * 100).toFixed(1) : null;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", letterSpacing: -0.6, margin: 0 }}>
          Pessoas
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-3)", marginTop: 6 }}>
          Headcount e movimentação de colaboradores CLT
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 28 }}>
        <KpiCard label="Headcount ativo" value={String(totalAtivo)} />
        <KpiCard label="Folha bruta (mês)" value={BRL.format(totalFolha)} />
        <KpiCard label="Admissões (mês)" value={String(totalAdmissoes)} ok={totalAdmissoes > 0} />
        <KpiCard
          label="Demissões (mês)"
          value={`${totalDemissoes}${turnover ? ` (${turnover}%)` : ""}`}
          alert={Number(turnover) > 5}
        />
      </div>

      {rows.length > 0 ? (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            overflow: "hidden",
            marginBottom: 28,
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
                {["Marca", "Headcount Ativo", "Folha Bruta", "Admissões", "Demissões"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 16px",
                      textAlign: h === "Marca" ? "left" : "right",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 0.8,
                      textTransform: "uppercase",
                      color: "var(--text-3)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.brand_id ?? i} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--text)" }}>
                    {r.brand_name ?? "—"}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", color: "var(--text-2)" }}>
                    {r.headcount_ativo ?? 0}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", color: "var(--text-2)" }}>
                    {BRL.format(r.folha_bruta ?? 0)}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", color: (r.admissoes_mes ?? 0) > 0 ? "#22C55E" : "var(--text-3)" }}>
                    {r.admissoes_mes ?? 0}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", color: (r.demissoes_mes ?? 0) > 0 ? "#EF4444" : "var(--text-3)" }}>
                    {r.demissoes_mes ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-3)", fontSize: 14 }}>
          Sem dados de headcount disponíveis. Verifique a integração com o módulo de RH.
        </div>
      )}

      <InsightPanel
        module="pessoas"
        context={{
          headcount_total: totalAtivo,
          folha_bruta_total: totalFolha,
          admissoes_mes: totalAdmissoes,
          demissoes_mes: totalDemissoes,
          turnover_pct: turnover != null ? Number(turnover) : null,
          por_marca: rows.map((r) => ({
            marca: r.brand_name,
            headcount: r.headcount_ativo,
            admissoes: r.admissoes_mes,
            demissoes: r.demissoes_mes,
          })),
        }}
        title="Insight de Pessoas"
      />
    </div>
  );
}

function KpiCard({ label, value, ok, alert }: { label: string; value: string; ok?: boolean; alert?: boolean }) {
  const color = alert ? "#EF4444" : ok ? "#22C55E" : "var(--text)";
  return (
    <div
      style={{
        background: "var(--surface)",
        border: `1px solid ${alert ? "rgba(239,68,68,0.3)" : ok ? "rgba(34,197,94,0.3)" : "var(--border)"}`,
        borderRadius: 8,
        padding: "18px 20px",
      }}
    >
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "var(--text-3)", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color, letterSpacing: -0.4 }}>{value}</div>
    </div>
  );
}
