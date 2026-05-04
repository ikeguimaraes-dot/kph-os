import { Suspense } from "react";
import { listTipsByUnit } from "@/lib/pessoas/actions";
import { requireUser } from "@/lib/auth/server";
import { getCurrentUnit } from "@/lib/auth/unit";
import { GorjetasClient } from "./gorjetas-client";

export const dynamic = "force-dynamic";

export default async function GorjetasPage() {
  await requireUser();
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto" }}>
      <header style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1.6,
            textTransform: "uppercase",
            color: "var(--text-3)",
          }}
        >
          Pessoas · Gorjetas
        </div>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            margin: "6px 0 4px",
            color: "var(--text)",
            letterSpacing: -0.4,
          }}
        >
          Gorjetas da unit
        </h1>
        <p
          style={{
            fontSize: 12,
            color: "var(--text-3)",
            margin: 0,
            lineHeight: 1.55,
            maxWidth: 720,
          }}
        >
          Distribuição mensal de gorjetas por pontuação. Para lançar gorjetas de
          um colaborador, acesse seu perfil.
        </p>
      </header>

      <Suspense
        fallback={
          <div style={{ color: "var(--text-3)", fontSize: 13 }}>
            Carregando…
          </div>
        }
      >
        <GorjetasSection />
      </Suspense>
    </div>
  );
}

async function GorjetasSection() {
  const unit = await getCurrentUnit();
  if (!unit) {
    return (
      <div
        style={{
          background: "var(--surface)",
          border: "1px dashed var(--border)",
          borderRadius: 8,
          padding: "32px 22px",
          textAlign: "center",
          color: "var(--text-3)",
          fontSize: 13,
        }}
      >
        Selecione uma unit no topo para ver as gorjetas.
      </div>
    );
  }

  const now = new Date();
  const records = await listTipsByUnit(
    unit.id,
    now.getMonth() + 1,
    now.getFullYear(),
  );

  return (
    <GorjetasClient
      unitName={unit.name}
      records={records}
      defaultMes={now.getMonth() + 1}
      defaultAno={now.getFullYear()}
    />
  );
}
