-- Migration: 066_gorjeta_distribuicao.sql
-- Created: 2026-05-29
-- Description: Cria a tabela gorjeta_distribuicao para gerenciar o rateio mensal de gorjetas por colaborador.

CREATE TABLE IF NOT EXISTS gorjeta_distribuicao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  ano INTEGER NOT NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  dias_trabalhados NUMERIC(5,2) NOT NULL,
  pontuacao NUMERIC(10,2) NOT NULL,
  percentual NUMERIC(5,2) NOT NULL,
  valor_bruto NUMERIC(10,2) NOT NULL,
  valor_liquido NUMERIC(10,2) NOT NULL,
  recibo_gerado_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (unit_id, mes, ano, employee_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gorjeta_distribuicao_periodo ON gorjeta_distribuicao(unit_id, ano, mes);
CREATE INDEX IF NOT EXISTS idx_gorjeta_distribuicao_employee ON gorjeta_distribuicao(employee_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_gorjeta_distribuicao_updated_at ON gorjeta_distribuicao;
CREATE TRIGGER update_gorjeta_distribuicao_updated_at
  BEFORE UPDATE ON gorjeta_distribuicao
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS
ALTER TABLE gorjeta_distribuicao ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "gorjeta_distribuicao_founder_all" ON gorjeta_distribuicao;
CREATE POLICY "gorjeta_distribuicao_founder_all" ON gorjeta_distribuicao
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'founder'
    )
  );

DROP POLICY IF EXISTS "gorjeta_distribuicao_gm_all" ON gorjeta_distribuicao;
CREATE POLICY "gorjeta_distribuicao_gm_all" ON gorjeta_distribuicao
  FOR ALL USING (
    unit_id IN (
      SELECT unit_id FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('gm', 'cfo', 'pessoas')
    )
  );

DROP POLICY IF EXISTS "gorjeta_distribuicao_collaborator_own" ON gorjeta_distribuicao;
CREATE POLICY "gorjeta_distribuicao_collaborator_own" ON gorjeta_distribuicao
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE user_id = auth.uid()
    )
  );
