-- Migration 069: learning_machine_reports
-- Armazena os relatórios semanais gerados pelo Learning Machine.
-- EXECUTAR MANUALMENTE no Supabase.

CREATE TABLE IF NOT EXISTS public.learning_machine_reports (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number      integer NOT NULL,
  year             integer NOT NULL,
  total_runs       integer NOT NULL DEFAULT 0,
  active_agents    integer NOT NULL DEFAULT 0,
  inactive_agents  integer NOT NULL DEFAULT 0,
  top_agents       jsonb,
  dormant_agents   jsonb,
  missing_agents   jsonb,
  insights         jsonb,
  raw_analysis     text,
  generated_at     timestamptz DEFAULT now(),
  UNIQUE (week_number, year)
);

ALTER TABLE public.learning_machine_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated read learning_machine_reports"
  ON public.learning_machine_reports
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated upsert learning_machine_reports"
  ON public.learning_machine_reports
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated update learning_machine_reports"
  ON public.learning_machine_reports
  FOR UPDATE TO authenticated USING (true);

GRANT SELECT, INSERT, UPDATE ON public.learning_machine_reports TO authenticated;
GRANT SELECT ON public.learning_machine_reports TO anon;

CREATE INDEX lm_reports_week_idx ON public.learning_machine_reports (year DESC, week_number DESC);
