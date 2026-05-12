-- Migration 055: Avaliação 360° + 9Box

-- Adiciona tipo_avaliador na tabela performance_reviews
ALTER TABLE public.performance_reviews
ADD COLUMN IF NOT EXISTS tipo_avaliador TEXT
  CHECK (tipo_avaliador IN ('autoavaliacao', 'par', 'gestor', 'liderado'))
  DEFAULT 'gestor';

-- Adiciona campo anonimo
ALTER TABLE public.performance_reviews
ADD COLUMN IF NOT EXISTS anonimo BOOLEAN DEFAULT false;

-- Tabela de ciclos de avaliação 360
CREATE TABLE IF NOT EXISTS public.avaliacao_ciclos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id),
  nome TEXT NOT NULL,
  template_id UUID REFERENCES public.performance_templates(id),
  status TEXT NOT NULL DEFAULT 'aberto'
    CHECK (status IN ('aberto', 'em_andamento', 'encerrado')),
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.avaliacao_ciclos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "unit_access" ON public.avaliacao_ciclos
  USING (unit_id IN (
    SELECT unit_id FROM public.user_roles WHERE user_id = auth.uid()
  ));

-- Participantes do ciclo (quem avalia quem)
CREATE TABLE IF NOT EXISTS public.avaliacao_participantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ciclo_id UUID NOT NULL REFERENCES public.avaliacao_ciclos(id) ON DELETE CASCADE,
  avaliado_id UUID NOT NULL REFERENCES public.employees(id),
  avaliador_id UUID NOT NULL REFERENCES public.employees(id),
  tipo_avaliador TEXT NOT NULL
    CHECK (tipo_avaliador IN ('autoavaliacao', 'par', 'gestor', 'liderado')),
  status TEXT DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'concluido')),
  review_id UUID REFERENCES public.performance_reviews(id),
  CONSTRAINT avaliacao_unica UNIQUE (ciclo_id, avaliado_id, avaliador_id)
);
ALTER TABLE public.avaliacao_participantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ciclo_unit_access" ON public.avaliacao_participantes
  USING (ciclo_id IN (
    SELECT id FROM public.avaliacao_ciclos
    WHERE unit_id IN (
      SELECT unit_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  ));
