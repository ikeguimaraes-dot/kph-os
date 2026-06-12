// Calcula o KPH Intelligence Score (0-100) baseado nos dados do WBR.
// Pesos: CMV 30% · EBITDA 30% · Metas 20% · Adoção 10% · Bugs 10%

import type { WbrPayload } from "./wbr-shared";

export type IntelligenceScore = {
  score: number;        // 0-100
  delta: number | null; // diferença vs semana anterior (null se sem histórico)
  cmv_score: number;
  ebitda_score: number;
  metas_score: number;
  adocao_score: number;
  bugs_score: number;
  breakdown: {
    label: string;
    score: number;
    weight: number;
    detail: string;
  }[];
};

export function calcIntelligenceScore(
  payload: WbrPayload,
  previousScore?: number | null,
): IntelligenceScore {
  const brands = payload.brands;

  // CMV Score (30%): média do CMV de todas as marcas vs benchmark 28%
  // Score 100 = CMV 0% · Score 0 = CMV ≥ 40%
  const cmvValues = brands
    .filter((b) => b.cmv_pct != null)
    .map((b) => b.cmv_pct!);
  const cmvAvg =
    cmvValues.length > 0
      ? cmvValues.reduce((a, b) => a + b, 0) / cmvValues.length
      : null;
  const cmv_score =
    cmvAvg == null
      ? 50 // neutro se sem dados
      : cmvAvg <= 28
      ? 100
      : cmvAvg <= 32
      ? Math.round(100 - ((cmvAvg - 28) / 4) * 40) // 100→60 entre 28% e 32%
      : Math.max(0, Math.round(60 - ((cmvAvg - 32) / 8) * 60)); // 60→0 entre 32% e 40%

  // EBITDA Score (30%): média EBITDA vs benchmark 18%
  // Score 100 = EBITDA ≥ 25% · Score 0 = EBITDA ≤ 0%
  const ebitdaValues = brands
    .filter((b) => b.ebitda_pct != null)
    .map((b) => b.ebitda_pct!);
  const ebitdaAvg =
    ebitdaValues.length > 0
      ? ebitdaValues.reduce((a, b) => a + b, 0) / ebitdaValues.length
      : null;
  const ebitda_score =
    ebitdaAvg == null
      ? 50
      : ebitdaAvg >= 25
      ? 100
      : ebitdaAvg >= 18
      ? Math.round(70 + ((ebitdaAvg - 18) / 7) * 30) // 70→100 entre 18% e 25%
      : ebitdaAvg >= 0
      ? Math.round((ebitdaAvg / 18) * 70)             // 0→70 entre 0% e 18%
      : 0;

  // Metas Score (20%): % de marcas com receita realizada ≥ 90% da projetada
  const metasTotal = brands.length;
  const metasOk = brands.filter(
    (b) =>
      b.receita_projetada > 0 &&
      b.receita_realizada / b.receita_projetada >= 0.9,
  ).length;
  const metas_score =
    metasTotal > 0 ? Math.round((metasOk / metasTotal) * 100) : 50;

  // Adoção Score (10%): 50 por padrão (sem dados da tabela page_views aqui)
  // Será enriquecido quando page_views tiver dados
  const adocao_score = 50;

  // Bugs Score (10%): baseado em alertas críticos
  // Score 100 = 0 alertas críticos · Score 0 = ≥ 5 alertas críticos
  const totalCriticos = payload.total_alertas_criticos;
  const bugs_score =
    totalCriticos === 0
      ? 100
      : totalCriticos === 1
      ? 80
      : totalCriticos === 2
      ? 60
      : totalCriticos <= 4
      ? 40
      : 0;

  // Score final ponderado
  const score = Math.round(
    cmv_score * 0.3 +
      ebitda_score * 0.3 +
      metas_score * 0.2 +
      adocao_score * 0.1 +
      bugs_score * 0.1,
  );

  const delta =
    previousScore != null ? score - previousScore : null;

  return {
    score,
    delta,
    cmv_score,
    ebitda_score,
    metas_score,
    adocao_score,
    bugs_score,
    breakdown: [
      {
        label: "CMV médio",
        score: cmv_score,
        weight: 30,
        detail:
          cmvAvg != null ? `${cmvAvg.toFixed(1)}% (meta ≤28%)` : "sem dados",
      },
      {
        label: "EBITDA médio",
        score: ebitda_score,
        weight: 30,
        detail:
          ebitdaAvg != null
            ? `${ebitdaAvg.toFixed(1)}% (meta ≥18%)`
            : "sem dados",
      },
      {
        label: "Metas atingidas",
        score: metas_score,
        weight: 20,
        detail: `${metasOk}/${metasTotal} marcas ≥90% da projeção`,
      },
      {
        label: "Adoção KPH-OS",
        score: adocao_score,
        weight: 10,
        detail: "Dados em ativação",
      },
      {
        label: "Alertas críticos",
        score: bugs_score,
        weight: 10,
        detail: `${totalCriticos} alerta${totalCriticos !== 1 ? "s" : ""} crítico${totalCriticos !== 1 ? "s" : ""}`,
      },
    ],
  };
}
