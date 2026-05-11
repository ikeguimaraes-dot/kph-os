-- Migration 049: seed hos_job para o agente Compliance Documental
INSERT INTO public.hos_jobs (name, slug, description, auto_approve, is_active)
VALUES (
  'Compliance Documental',
  'compliance_documental',
  'Monitora documentos de colaboradores vencendo em 30/15/7 dias e emite alertas para aprovação do RH.',
  false,
  true
)
ON CONFLICT (slug) DO NOTHING;
