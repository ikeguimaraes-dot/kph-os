# KPH OS — Orquestrador HOS

## O que é este projeto
Sistema de governança de agentes de IA da KPH Participações. Princípio central: nenhuma automação age em produção sem aprovação humana. Agentes sugerem, humanos decidem.

URL de produção: https://kph-os.vercel.app

## Stack
- **Frontend/Backend:** Next.js 16 (App Router), TypeScript
- **Banco:** Supabase (PostgreSQL) com RLS
- **Deploy:** Vercel Pro
- **Notificações:** Discord (webhook + bot ClaudeBridge)
- **IA:** Claude API (claude-sonnet-4-20250514)
- **CI/CD:** GitHub Actions + Vercel

## Estrutura de arquivos chave
```
src/
  app/
    api/
      orchestrator/
        webhook/        ← recebe eventos Vercel
        qa-callback/    ← recebe resultados do QA Playwright
        escalate/       ← cron de escalação
      discord/
        interactions/   ← slash commands /aprovar /rejeitar
      github-webhook/   ← eventos de PR do GitHub
    (dashboard)/
      orquestrador/     ← painel de execuções
  lib/
    orquestrador/
      actions.ts        ← autoApproveRun, updateRunLogs, markRunFailed
      agents/
        code-review.ts  ← agente de code review
    discord/
      notify.ts         ← sendDiscordMessage
    supabase/
      server.ts         ← createClient, createServiceClient
tests/
  smoke.spec.ts         ← 4 smoke tests Playwright
.github/workflows/
  qa-playwright.yml     ← dispara em deployment_status Preview
```

## Banco de dados — tabelas HOS
- `hos_jobs` — catálogo de jobs. Campos: id, name, slug, auto_approve, is_active
- `hos_runs` — execuções. Status: pending → running → awaiting_approval → approved/rejected/failed. Campo `archived_at` para runs antigos
- `hos_approvals` — decisões humanas. user_id FK → auth.users. Sistema usa UUID 00000000-0000-0000-0000-000000000001 para aprovações automáticas
- `hos_insights` — relatórios semanais gerados pelo Claude

## Jobs ativos
| slug | nome | auto_approve |
|------|------|-------------|
| qa_preview | QA Playwright Preview | TRUE |
| code_review | Code Review PR | FALSE (executa agente) |
| deploy_prod | Deploy Production | FALSE (aprovação humana) |

## Agentes operacionais
1. **Approval Escalator** — cron 30min, renotifica runs pendentes em tiers 2h/4h/8h
2. **Discord Commander** — slash commands /aprovar /rejeitar
3. **Code Review PR** — Claude analisa diff, posta comment no GitHub
4. **QA Playwright** — GitHub Actions roda smoke tests no preview, callback atualiza run

## Variáveis de ambiente críticas
- `SUPABASE_SERVICE_ROLE_KEY` — bypassa RLS, usar só em server actions/route handlers
- `DISCORD_WEBHOOK_URL` — notificações no #orquestrador
- `DISCORD_BOT_TOKEN` — bot ClaudeBridge
- `DISCORD_PUBLIC_KEY` — verificação Ed25519
- `GITHUB_TOKEN` — PAT para code review
- `GITHUB_WEBHOOK_SECRET` — verificação de webhook GitHub
- `QA_CALLBACK_SECRET` — autenticação do callback QA
- `ANTHROPIC_API_KEY` — Claude API

## Convenções do projeto
- Commits: `feat/fix/chore/debug(escopo): descrição` em português ou inglês
- Migrations: `0XX_descricao.sql` em `supabase/migrations/`
- Sempre rodar migration no Supabase manualmente antes de mergear PRs que adicionem colunas
- RLS: founder/gm/admin podem SELECT/INSERT/UPDATE nas tabelas HOS
- Bypass user: UUID `00000000-0000-0000-0000-000000000001` (bypass@kph.os, role founder)

## RLS — importante
O usuário de bypass tem id fixo `00000000-0000-0000-0000-000000000001`. NUNCA usar string "bypass" como user_id — PostgreSQL rejeita o cast para UUID (bug histórico, PR #13).

## Estado atual (08/05/2026)
PRs mergeados até hoje: #1 ao #20 + hotfixes em main. Sistema estável. Próximos: Discord Commander conversacional, CLAUDE.md hooks, DB Guardian.
