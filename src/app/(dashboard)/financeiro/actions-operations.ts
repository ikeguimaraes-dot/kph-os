"use server";

import { createOperationsClient } from "@/lib/supabase/operations-client";
import type {
  WorkdayResumo,
  MetaProjecao,
  TituloAPagar,
} from "@/types/operations-database";

// ── helpers ──────────────────────────────────────────────────────────────────

/** "2026-05-01" → mes_ano "2026-5" (formato do metas_projecoes) */
function competenciaToMesAno(competencia: string): string {
  const [y, m] = competencia.split("-");
  return `${y}-${parseInt(m ?? "1", 10)}`;
}

/** "2026-05-01" → { dateFrom: "2026-05-01", dateTo: "2026-05-31" } */
function competenciaToRange(competencia: string): {
  dateFrom: string;
  dateTo: string;
} {
  const [y, m] = competencia.split("-");
  const year = parseInt(y ?? "1970", 10);
  const month = parseInt(m ?? "1", 10);
  const lastDay = new Date(year, month, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    dateFrom: `${year}-${pad(month)}-01`,
    dateTo: `${year}-${pad(month)}-${lastDay}`,
  };
}

/**
 * JS getDay() → índice em metas_diarias [seg=0, ter=1, qua=2, qui=3, sex=4, sab=5, dom=6]
 * JS: 0=dom, 1=seg, 2=ter, 3=qua, 4=qui, 5=sex, 6=sab
 */
function jsWeekdayToMetaIndex(jsDay: number): number {
  const map: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 };
  return map[jsDay] ?? 0;
}

// ── Workday ───────────────────────────────────────────────────────────────────

/** Todos os dias de um mês no workday_resumo. */
export async function getWorkdayResumoMes(
  competencia: string,
): Promise<WorkdayResumo[]> {
  const ops = createOperationsClient();
  if (!ops) return [];

  const { dateFrom, dateTo } = competenciaToRange(competencia);
  const { data, error } = await ops
    .from("workday_resumo")
    .select(
      "workday_id,data,acessos,permanencia,cmv_pct,ticket_zero,ticket_real,ticket_medio,bruto,desconto,gorjeta,custo,despesa,lucro,consumo_total,cancelamentos_total,descontos_total,total_recebido,pagamentos,turnos,ambientes",
    )
    .gte("data", dateFrom)
    .lte("data", dateTo)
    .order("data", { ascending: true });

  if (error) {
    console.error("[getWorkdayResumoMes]", error.message);
    return [];
  }
  return (data ?? []) as WorkdayResumo[];
}

/** Metas do mês (meta total + array diário por dia da semana). */
export async function getMetasMes(
  competencia: string,
): Promise<MetaProjecao | null> {
  const ops = createOperationsClient();
  if (!ops) return null;

  const mesAno = competenciaToMesAno(competencia);
  const { data, error } = await ops
    .from("metas_projecoes")
    .select("id,mes_ano,meta_faturamento,metas_diarias")
    .eq("mes_ano", mesAno)
    .maybeSingle();

  if (error) {
    console.error("[getMetasMes]", error.message);
    return null;
  }
  return data as MetaProjecao | null;
}

// ── Contas a Pagar ────────────────────────────────────────────────────────────

/** Todos os títulos a pagar de uma competência (filtro por ref_mes). */
export async function getTitulosAPagar(
  competencia: string,
): Promise<TituloAPagar[]> {
  const ops = createOperationsClient();
  if (!ops) return [];

  // ref_mes é "YYYY-MM-01" no banco
  const refMes = competencia.slice(0, 7) + "-01";

  const { data, error } = await ops
    .from("titulos_a_pagar")
    .select(
      "id,tipo,fantasia_fornecedor,razao_fornecedor,descricao_c_gerencial,n_titulo,parcela,portador,d_lancamento,d_competencia,d_vencimento,v_titulo,v_saldo_atual,dias_atraso_atual,situacao_atual,tipo_sep,fluxo_de_caixa,ref_mes",
    )
    .eq("ref_mes", refMes)
    .order("d_vencimento", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("[getTitulosAPagar]", error.message);
    return [];
  }
  return (data ?? []) as TituloAPagar[];
}

// ── Tipos derivados expostos para as pages ────────────────────────────────────

export type WorkdayDiaEnriquecido = WorkdayResumo & {
  meta_dia: number | null;
  atingimento_pct: number | null;
  dia_semana: string;
};

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/**
 * Combina workday_resumo + metas_projecoes → array enriquecido pronto para render.
 * Chama `getWorkdayResumoMes` + `getMetasMes` em paralelo.
 */
export async function getFluxoCaixaMes(competencia: string): Promise<{
  dias: WorkdayDiaEnriquecido[];
  meta: MetaProjecao | null;
  totais: {
    bruto: number;
    desconto: number;
    gorjeta: number;
    custo: number;
    lucro: number;
    acessos: number;
    cmv_pct_medio: number | null;
    ticket_medio: number | null;
    meta_total: number;
    atingimento_pct: number | null;
  };
}> {
  const [resumo, meta] = await Promise.all([
    getWorkdayResumoMes(competencia),
    getMetasMes(competencia),
  ]);

  const dias: WorkdayDiaEnriquecido[] = resumo.map((r) => {
    const date = new Date(`${r.data}T12:00:00`);
    const jsDay = date.getDay();
    const metaIdx = jsWeekdayToMetaIndex(jsDay);
    const metaDia = meta?.metas_diarias?.[metaIdx] ?? null;
    const atingimento =
      metaDia && metaDia > 0 ? Math.round((r.bruto / metaDia) * 100) : null;
    return {
      ...r,
      meta_dia: metaDia,
      atingimento_pct: atingimento,
      dia_semana: DIAS_SEMANA[jsDay] ?? "—",
    };
  });

  // totais
  const bruto = dias.reduce((s, d) => s + (d.bruto ?? 0), 0);
  const desconto = dias.reduce((s, d) => s + (d.desconto ?? 0), 0);
  const gorjeta = dias.reduce((s, d) => s + (d.gorjeta ?? 0), 0);
  const custo = dias.reduce((s, d) => s + (d.custo ?? 0), 0);
  const lucro = dias.reduce((s, d) => s + (d.lucro ?? 0), 0);
  const acessos = dias.reduce((s, d) => s + (d.acessos ?? 0), 0);
  const cmv_pct_medio =
    dias.length > 0
      ? Math.round(
          dias.reduce((s, d) => s + (d.cmv_pct ?? 0), 0) / dias.length,
        )
      : null;
  const ticket_medio =
    acessos > 0 ? Math.round((bruto / acessos) * 100) / 100 : null;
  const meta_total = meta?.meta_faturamento ?? 0;
  const atingimento_pct =
    meta_total > 0 ? Math.round((bruto / meta_total) * 100 * 10) / 10 : null;

  return {
    dias,
    meta,
    totais: {
      bruto,
      desconto,
      gorjeta,
      custo,
      lucro,
      acessos,
      cmv_pct_medio,
      ticket_medio,
      meta_total,
      atingimento_pct,
    },
  };
}

/** KPIs para a página de contas a pagar. */
export type PagarKpis = {
  total_titulos: number;
  total_valor: number;
  total_saldo: number;
  vencidos_count: number;
  vencidos_valor: number;
  a_vencer_30d_valor: number;
  fluxo_caixa_valor: number;
};

export async function getPagarKpisETitulos(competencia: string): Promise<{
  titulos: TituloAPagar[];
  kpis: PagarKpis;
}> {
  const titulos = await getTitulosAPagar(competencia);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const em30d = new Date(hoje);
  em30d.setDate(em30d.getDate() + 30);

  let total_valor = 0;
  let total_saldo = 0;
  let vencidos_count = 0;
  let vencidos_valor = 0;
  let a_vencer_30d_valor = 0;
  let fluxo_caixa_valor = 0;

  for (const t of titulos) {
    const v = t.v_titulo ?? 0;
    const s = t.v_saldo_atual ?? 0;
    total_valor += v;
    total_saldo += s;

    if (t.fluxo_de_caixa) fluxo_caixa_valor += s;

    if (t.d_vencimento) {
      const venc = new Date(`${t.d_vencimento}T12:00:00`);
      if (venc < hoje) {
        vencidos_count += 1;
        vencidos_valor += s;
      } else if (venc <= em30d) {
        a_vencer_30d_valor += s;
      }
    }
  }

  return {
    titulos,
    kpis: {
      total_titulos: titulos.length,
      total_valor,
      total_saldo,
      vencidos_count,
      vencidos_valor,
      a_vencer_30d_valor,
      fluxo_caixa_valor,
    },
  };
}
