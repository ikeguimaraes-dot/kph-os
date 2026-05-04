import { Suspense } from "react";
import { listOvertimeByUnit } from "@/lib/pessoas/actions";
import { requireUser } from "@/lib/auth/server";
import { getCurrentUnit } from "@/lib/auth/unit";
import { HorasExtrasClient } from "./horas-extras-client";

export const dynamic = "force-dynamic";

export default async function HorasExtrasPage() {
  await requireUser();
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto" }}>
      <header style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.6, textTransform: "uppercase", color: "var(--text-3)" }}>
          Pessoas · Horas Extras
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: "6px 0 4px", color: "var(--text)", letterSpacing: -0.4 }}>
          Horas Extras da unit
        </h1>
        <p style={{ fontSize: 12, color: "var(--text-3)", margin: 0, lineHeight: 1.55, maxWidth: 720 }}>
          Registros de horas extras com aprovação inline. Para lançar HE, acesse o perfil do colaborador.
        </p>
      </header>
      <Suspense fallback={<div style={{ color: "var(--text-3)", fontSize: 13 }}>Carregando…</div>}>
        <HorasExtrasSection />
      </Suspense>
    </div>
  );
}

async function HorasExtrasSection() {
  const unit = await getCurrentUnit();
  if (!unit) {
    return (
      <div style={{ background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: 8, padding: "32px 22px", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
        Selecione uma unit no topo para ver as horas extras.
      </div>
    );
  }
  const now = new Date();
  const records = await listOvertimeByUnit(unit.id, now.getMonth() + 1, now.getFullYear());
  return <HorasExtrasClient unitName={unit.name} records={records} defaultMes={now.getMonth() + 1} defaultAno={now.getFullYear()} />;
}
