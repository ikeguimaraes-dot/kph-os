-- Migration 061: Seed hos_jobs para Score Monitor e Banco de Horas Monitor

INSERT INTO hos_jobs (slug, name, description, auto_approve, is_active)
VALUES
  (
    'score_monitor',
    'Score Monitor',
    'Detecta colaboradores com score disciplinar abaixo de 70 e notifica para revisão.',
    false,
    true
  ),
  (
    'banco_horas_monitor',
    'Banco de Horas Monitor',
    'Detecta colaboradores com saldo de banco de horas acima de 40h para programação de compensação.',
    false,
    true
  )
ON CONFLICT (slug) DO NOTHING;
