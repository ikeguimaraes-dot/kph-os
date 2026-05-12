-- Migration 059: Onboarding automatizado

CREATE TABLE IF NOT EXISTS public.onboarding_templates (
  id          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id     UUID      NOT NULL REFERENCES public.units(id),
  nome        TEXT      NOT NULL,
  descricao   TEXT,
  ativo       BOOLEAN   DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.onboarding_tarefas (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id  UUID NOT NULL REFERENCES public.onboarding_templates(id) ON DELETE CASCADE,
  titulo       TEXT NOT NULL,
  descricao    TEXT,
  responsavel  TEXT NOT NULL CHECK (responsavel IN ('rh', 'gestor', 'colaborador', 'ti')),
  prazo_dias   INT  NOT NULL DEFAULT 1,
  ordem        INT  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.onboarding_runs (
  id           UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id      UUID      NOT NULL REFERENCES public.units(id),
  employee_id  UUID      NOT NULL REFERENCES public.employees(id),
  template_id  UUID      NOT NULL REFERENCES public.onboarding_templates(id),
  status       TEXT      NOT NULL DEFAULT 'em_andamento'
    CHECK (status IN ('em_andamento', 'concluido', 'cancelado')),
  data_inicio  DATE      NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.onboarding_checklist (
  id             UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id         UUID      NOT NULL REFERENCES public.onboarding_runs(id) ON DELETE CASCADE,
  tarefa_id      UUID      NOT NULL REFERENCES public.onboarding_tarefas(id),
  status         TEXT      NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'concluido', 'ignorado')),
  concluido_em   TIMESTAMPTZ,
  concluido_por  UUID      REFERENCES auth.users(id)
);

ALTER TABLE public.onboarding_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_runs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "unit_access_templates" ON public.onboarding_templates
  USING (unit_id IN (SELECT unit_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "unit_access_runs" ON public.onboarding_runs
  USING (unit_id IN (SELECT unit_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "checklist_access" ON public.onboarding_checklist
  USING (run_id IN (
    SELECT id FROM public.onboarding_runs WHERE unit_id IN (
      SELECT unit_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  ));

CREATE INDEX IF NOT EXISTS onboarding_runs_employee   ON public.onboarding_runs(employee_id);
CREATE INDEX IF NOT EXISTS onboarding_runs_template   ON public.onboarding_runs(template_id);
CREATE INDEX IF NOT EXISTS onboarding_runs_unit       ON public.onboarding_runs(unit_id);
CREATE INDEX IF NOT EXISTS onboarding_checklist_run   ON public.onboarding_checklist(run_id);
CREATE INDEX IF NOT EXISTS onboarding_tarefas_tpl     ON public.onboarding_tarefas(template_id);
