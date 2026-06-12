"use server";
// Gera insight automático do WBR usando Anthropic API.
// Requer ANTHROPIC_API_KEY no ambiente.
// npm install @anthropic-ai/sdk

import Anthropic from "@anthropic-ai/sdk";
import type { WbrPayload } from "@/lib/inteligencia/wbr-shared";

export type WbrInsight = {
  text: string;
  gerado_em: string;
};

export async function generateWbrInsight(
  payload: WbrPayload,
): Promise<WbrInsight | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null; // Silencioso — key não configurada ainda

  try {
    const client = new Anthropic({ apiKey });

    const marcasResumo = payload.brands.map((b) => ({
      marca: b.brand_name,
      receita: b.receita_realizada,
      projetado: b.receita_projetada,
      cmv_pct: b.cmv_pct,
      ebitda_pct: b.ebitda_pct,
      prime_cost_pct: b.prime_cost_pct,
      headcount: b.headcount_ativo,
      alertas_criticos: b.alertas_criticos,
    }));

    const promptData = JSON.stringify({
      periodo: `${payload.weekStart} até ${payload.weekEnd}`,
      total_receita: payload.total_receita,
      total_headcount: payload.total_headcount,
      total_alertas_criticos: payload.total_alertas_criticos,
      marcas: marcasResumo,
      benchmarks_kph: {
        cmv_meta: "≤ 28%",
        ebitda_meta: "≥ 18%",
        prime_cost_meta: "≤ 55%",
      },
    });

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: `Você é o CFO de um grupo de restaurantes premium brasileiro chamado KPH. Analise estes dados do Weekly Business Review e forneça exatamente 3 insights acionáveis em português brasileiro. Seja direto, específico e oriente para ação. Use os dados concretos, não generalidades.

Dados:
${promptData}

Formato de resposta — apenas os 3 insights numerados, sem introdução ou conclusão:
1. [insight sobre o KPI mais crítico desta semana]
2. [insight sobre tendência ou padrão identificado]
3. [ação recomendada com impacto financeiro estimado]`,
        },
      ],
    });

    const text =
      message.content[0]?.type === "text" ? message.content[0].text : null;
    if (!text) return null;

    return {
      text,
      gerado_em: new Date().toISOString(),
    };
  } catch (e) {
    console.error("[generateWbrInsight] erro:", e);
    return null;
  }
}
