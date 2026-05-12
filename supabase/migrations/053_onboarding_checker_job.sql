-- Migration 053: onboarding_checker — job + adiciona foto_3x4 ao CHECK de employee_documents.tipo

-- Expande o CHECK constraint para incluir foto_3x4
ALTER TABLE employee_documents DROP CONSTRAINT employee_documents_tipo_check;
ALTER TABLE employee_documents ADD CONSTRAINT employee_documents_tipo_check CHECK (tipo IN (
  'aso_admissional', 'aso_periodico', 'aso_demissional',
  'ctps', 'rg', 'cpf', 'cnh', 'comprovante_residencia',
  'titulo_eleitor', 'reservista', 'pis_pasep',
  'certidao_nascimento', 'certidao_casamento',
  'comprovante_escolaridade', 'certificado_curso',
  'epi_recibo', 'uniforme_recibo',
  'contrato_trabalho', 'contrato_aditivo',
  'rescisao', 'termo_quitacao',
  'atestado_medico', 'declaracao', 'outro',
  'foto_3x4'
));

-- Registra o job no Orquestrador
INSERT INTO hos_jobs (name, slug, description, auto_approve, is_active)
VALUES (
  'Onboarding Checker',
  'onboarding_checker',
  'Verifica documentos obrigatórios 7 dias após admissão',
  false,
  true
) ON CONFLICT (slug) DO NOTHING;
