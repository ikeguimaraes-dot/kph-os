-- Bucket de selfies de registro de ponto (web ponto app + HOS App mobile).
-- Upload exclusivo via service_role (Server Action registrarPunch).
-- Bucket privado: selfies são dados sensíveis de colaboradores.
-- Retenção 90 dias: cron /api/orchestrator/cron/cleanup-punches (DOM 02:00 UTC).
--
-- Path dos arquivos: {employee_uuid}/{timestamp_ms}.jpg

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'punch-photos',
  'punch-photos',
  false,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- SELECT: founder / gm / pessoas podem visualizar fotos (painel de aprovação de pontos).
-- Uploads e deletes são exclusivos do service_role — não precisam de policy (bypassam RLS).
CREATE POLICY "punch_photos_select_manager"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'punch-photos'
  AND EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND r.name IN ('founder', 'gm', 'pessoas')
  )
);

-- SELECT: colaborador autenticado vê apenas os próprios arquivos.
-- O primeiro segmento do path é o employee_id.
CREATE POLICY "punch_photos_select_own"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'punch-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT e.id::text
    FROM public.employees e
    WHERE e.user_id = auth.uid()
  )
);
