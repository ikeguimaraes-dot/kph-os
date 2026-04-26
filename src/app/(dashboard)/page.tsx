export default function DashboardPage() {
  return (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      <div style={{
        padding: "60px 40px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        textAlign: "center",
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: 1.6,
          textTransform: "uppercase", color: "var(--text-3)",
        }}>
          Dia 1 · Setup inicial
        </div>
        <h1 style={{
          fontSize: 36, fontWeight: 700, margin: "12px 0 14px",
          color: "var(--text)", letterSpacing: -0.5,
        }}>
          KPH <span style={{ color: "var(--brand)" }}>OS</span>
        </h1>
        <p style={{
          fontSize: 14, lineHeight: 1.65, color: "var(--text-2)",
          maxWidth: 560, margin: "0 auto",
        }}>
          Sistema operacional do grupo KPH em construção. Esta é a fundação —
          Next.js 16 + TypeScript strict + Tailwind v4 + shadcn/ui, paleta dark
          editorial herdada do painel Madonna.
        </p>
        <div style={{
          marginTop: 32, display: "inline-flex", alignItems: "center",
          gap: 10, padding: "10px 16px",
          background: "var(--brand-soft)", borderRadius: 99,
          color: "var(--brand)", fontSize: 12, fontWeight: 600,
        }}>
          Em construção · 8 módulos previstos
        </div>
      </div>

      <div style={{
        marginTop: 32, display: "grid", gap: 12,
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      }}>
        {MODULES.map((m) => (
          <div key={m.label} style={{
            padding: "20px 18px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
              {m.label}
            </div>
            <div style={{
              fontSize: 11, color: "var(--text-3)", marginTop: 6, lineHeight: 1.5,
            }}>
              {m.desc}
            </div>
            <div style={{
              marginTop: 12, fontSize: 10, fontWeight: 700,
              color: m.fase === 1 ? "var(--brand)" : "var(--text-3)",
              letterSpacing: 0.6, textTransform: "uppercase",
            }}>
              Fase {m.fase}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const MODULES: ReadonlyArray<{ label: string; desc: string; fase: number }> = [
  { label: "Operação",       desc: "Fluxo de caixa, contas a pagar, conciliação bancária.", fase: 2 },
  { label: "Pessoas",        desc: "Escala, ponto, holerite, banco de horas (CCT).",        fase: 1 },
  { label: "Cardápio",       desc: "Itens, ficha técnica, CMV.",                            fase: 4 },
  { label: "Compras",        desc: "Invoice OCR, fornecedores, estoque.",                   fase: 5 },
  { label: "Cliente",        desc: "Conversas, reservas, CRM. Migrado do painel Madonna.",  fase: 3 },
  { label: "Inteligência",   desc: "Serena, forecasting, anomalias, Clau.",                 fase: 3 },
  { label: "Marca & Cultura",desc: "Treinamentos, comunicados, pesquisas.",                 fase: 7 },
  { label: "Performance",    desc: "Cockpit do grupo, WBR automático.",                     fase: 6 },
];
