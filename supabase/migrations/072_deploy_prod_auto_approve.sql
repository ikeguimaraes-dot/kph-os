-- Migration 072_deploy_prod_auto_approve.sql
-- Muda deploy_prod para auto_approve = TRUE.
-- O webhook /api/orchestrator/webhook já lê esse flag e chama autoApproveRun()
-- imediatamente após criar o run — nenhuma mudança de código necessária.
-- Limpa a fila acumulada de runs deploy_prod com status awaiting_approval.

-- ── 1. Ativar auto_approve para deploy_prod ──────────────────────────
UPDATE public.hos_jobs
SET auto_approve = TRUE
WHERE slug = 'deploy_prod';

-- ── 2. Inserir registros de aprovação retroativos para a fila acumulada
-- Usa o bypass UUID (seedado em 039_seed_bypass_user.sql) para respeitar a FK de auth.users
INSERT INTO public.hos_approvals (run_id, user_id, decision, feedback)
SELECT
  r.id,
  '00000000-0000-0000-0000-000000000001',
  'approve',
  'Auto-aprovado retroativamente — deploy_prod passou a auto_approve=TRUE (migration 072)'
FROM public.hos_runs r
JOIN public.hos_jobs j ON j.id = r.job_id
WHERE j.slug = 'deploy_prod'
  AND r.status = 'awaiting_approval'
  AND NOT EXISTS (
    SELECT 1 FROM public.hos_approvals a WHERE a.run_id = r.id
  );

-- ── 3. Aprovar e arquivar os runs acumulados ─────────────────────────
UPDATE public.hos_runs
SET
  status      = 'approved',
  archived_at = NOW()
WHERE id IN (
  SELECT r.id
  FROM public.hos_runs r
  JOIN public.hos_jobs j ON j.id = r.job_id
  WHERE j.slug = 'deploy_prod'
    AND r.status = 'awaiting_approval'
);

-- ── 4. Verificação (retorna contagem por tipo/status após a limpeza)
-- Rodar manualmente para confirmar:
-- SELECT j.slug, r.status, COUNT(*) AS total
-- FROM public.hos_runs r
-- JOIN public.hos_jobs j ON j.id = r.job_id
-- GROUP BY j.slug, r.status
-- ORDER BY j.slug, r.status;
