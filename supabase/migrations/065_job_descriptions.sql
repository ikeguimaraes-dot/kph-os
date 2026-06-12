-- Migration: 065_job_descriptions.sql
-- Created: 2026-05-29
-- Description: Cria a tabela job_descriptions para gerenciar os detalhes de cargos de recrutamento.

CREATE TABLE IF NOT EXISTS job_descriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cargo TEXT NOT NULL,
  area TEXT NOT NULL CHECK (area IN ('cozinha', 'bar', 'salão', 'administrativo', 'gerência', 'eventos', 'outro')),
  responsabilidades TEXT,
  requisitos TEXT,
  beneficios TEXT,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (brand_id, cargo)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_job_descriptions_brand_id ON job_descriptions(brand_id);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_cargo ON job_descriptions(cargo);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_job_descriptions_updated_at ON job_descriptions;
CREATE TRIGGER update_job_descriptions_updated_at
  BEFORE UPDATE ON job_descriptions
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS
ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "job_descriptions_founder_all" ON job_descriptions;
CREATE POLICY "job_descriptions_founder_all" ON job_descriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'founder'
    )
  );

DROP POLICY IF EXISTS "job_descriptions_gm_all" ON job_descriptions;
CREATE POLICY "job_descriptions_gm_all" ON job_descriptions
  FOR ALL USING (
    brand_id IN (
      SELECT brand_id FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('gm', 'cfo', 'pessoas', 'chef', 'comprador')
    )
  );

DROP POLICY IF EXISTS "job_descriptions_authenticated_select" ON job_descriptions;
CREATE POLICY "job_descriptions_authenticated_select" ON job_descriptions
  FOR SELECT TO authenticated USING (true);
