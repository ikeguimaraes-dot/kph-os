-- ── kph_insights ──────────────────────────────────────────────────────────────
-- Migration: 067
-- Created:   2026-06-01
-- Sprint:    Intelligence Layer — AI Insights
-- Desc:      Insights gerados por LLM a partir dos módulos de inteligência KPH.
--            Cada insight é vinculado a um módulo e uma semana; o campo
--            `dados_referencia` persiste os dados usados na geração para
--            rastreabilidade e re-avaliação posterior.
--            `aprovado` funciona como gate de publicação: insights não aprovados
--            ficam em rascunho até revisão humana.
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.kph_insights (
  id               UUID    DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Módulo de inteligência que gerou o insight
  modulo           TEXT    NOT NULL
                           CHECK (modulo IN ('wbr','metas','cross','adocao','orquestrador','geral')),

  -- Semana de referência (segunda-feira da semana, ISO)
  semana           DATE    NOT NULL,

  insight_text     TEXT    NOT NULL,

  -- Snapshot dos dados usados na geração (métricas, séries, thresholds)
  dados_referencia JSONB,

  -- Modelo que gerou o insight — default reflete o modelo corrente em produção
  gerado_por       TEXT    DEFAULT 'claude-sonnet-4-6',

  -- Gate de publicação: false = rascunho, true = aprovado para exibição
  aprovado         BOOLEAN DEFAULT false,

  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kph_insights_modulo   ON public.kph_insights(modulo);
CREATE INDEX IF NOT EXISTS idx_kph_insights_semana   ON public.kph_insights(semana DESC);
CREATE INDEX IF NOT EXISTS idx_kph_insights_aprovado ON public.kph_insights(aprovado);

-- RLS
ALTER TABLE public.kph_insights ENABLE ROW LEVEL SECURITY;

-- Insights são conteúdo executivo gerado por IA — acesso restrito a founders e CFO.
CREATE POLICY "kph_insights_select" ON public.kph_insights
  FOR SELECT
  USING (kph_is_founder_or_cfo());

CREATE POLICY "kph_insights_manage" ON public.kph_insights
  FOR ALL
  USING     (kph_is_founder_or_cfo())
  WITH CHECK (kph_is_founder_or_cfo());
