-- Migration 068: agent_runs + orquestrador_jobs
-- Cria tabela de execuções de agentes e log de jobs do Orquestrador.
-- EXECUTAR MANUALMENTE no Supabase.

-- ── orquestrador_jobs ─────────────────────────────────────────────────
-- Histórico de execuções de jobs (separado de hos_jobs que é o catálogo de tipos).
CREATE TABLE IF NOT EXISTS public.orquestrador_jobs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type        text NOT NULL,
  status      text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'running', 'success', 'error')),
  payload     jsonb,
  result      jsonb,
  error_msg   text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE public.orquestrador_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated read orquestrador_jobs"
  ON public.orquestrador_jobs FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated insert orquestrador_jobs"
  ON public.orquestrador_jobs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "service update orquestrador_jobs"
  ON public.orquestrador_jobs FOR UPDATE TO authenticated USING (true);

GRANT SELECT, INSERT ON public.orquestrador_jobs TO authenticated;
GRANT SELECT ON public.orquestrador_jobs TO anon;

CREATE INDEX orquestrador_jobs_type_idx ON public.orquestrador_jobs (type);
CREATE INDEX orquestrador_jobs_created_at_idx ON public.orquestrador_jobs (created_at DESC);

-- ── agent_runs ────────────────────────────────────────────────────────
-- Registra cada execução de agente IA para o Learning Machine analisar.
CREATE TABLE IF NOT EXISTS public.agent_runs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name       text NOT NULL,
  category         text NOT NULL,
  triggered_by     text,
  status           text NOT NULL DEFAULT 'completed'
                     CHECK (status IN ('completed', 'failed', 'skipped')),
  duration_seconds integer,
  output_summary   text,
  week_number      integer NOT NULL,
  year             integer NOT NULL,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated read agent_runs"
  ON public.agent_runs FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated insert agent_runs"
  ON public.agent_runs FOR INSERT TO authenticated WITH CHECK (true);

GRANT SELECT, INSERT ON public.agent_runs TO authenticated;
GRANT SELECT ON public.agent_runs TO anon;

CREATE INDEX agent_runs_agent_name_idx ON public.agent_runs (agent_name);
CREATE INDEX agent_runs_week_idx ON public.agent_runs (year, week_number);
CREATE INDEX agent_runs_created_at_idx ON public.agent_runs (created_at DESC);
