-- Migration 071: corrige unicidade de kph_intelligence_scores
-- Problema: constraint era UNIQUE (semana) — apenas um score por semana, independente do módulo.
-- Isso fazia o upsert de operacao sobrescrever o insert de pessoas (e qualquer outro módulo).
-- Solução: substituir por UNIQUE (modulo, semana) para que cada módulo tenha sua própria linha.

ALTER TABLE kph_intelligence_scores
  DROP CONSTRAINT IF EXISTS kph_intelligence_scores_semana_key;

ALTER TABLE kph_intelligence_scores
  ADD CONSTRAINT kph_intelligence_scores_modulo_semana_key UNIQUE (modulo, semana);
