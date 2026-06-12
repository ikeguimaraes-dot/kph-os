# Relatório de Avaliação — KPH-OS Inteligência
**Data:** 2026-05-29
**Commit de referência:** `ab21566` (fix: suplementa WBR/Metas/Cross com vendas_diarias)
**Agentes executados:** UX Reviewer · Playwright Tester · Data Integrity Auditor
**Cobertura de rotas:** metas, wbr, cross, adocao, feedback, roadmap, orquestrador (7 rotas)

---

## Sumário Executivo

O módulo Inteligência possui infraestrutura sólida de componentes e lógica de negócio correta, mas está **bloqueado para ship** por um problema operacional único e de alta severidade: as migrations 067, 068 e 069 nunca foram aplicadas ao banco Supabase remoto. Isso torna três rotas completas inoperantes em produção (adocao, feedback, roadmap). Além desse bloqueador, há violações sistêmicas de paleta visual que afetam todas as 7 rotas, um bug de interpolação de string confirmado em /cross, e três políticas RLS com ambiguidade de segurança que precisam de correção antes de qualquer dado real ser gravado.

**Veredicto geral: VERMELHO — nao apto para ship ate migrations aplicadas e RLS corrigido.**

---

## Status por Rota

| Rota | Score UX | Testes Playwright | Bloqueio de DB | Status |
|---|---|---|---|---|
| `/inteligencia/metas` | 7/10 | N/A (nao coberta no smoke) | Nao | AMARELO |
| `/inteligencia/wbr` | 6/10 | N/A | Nao | AMARELO |
| `/inteligencia/cross` | 7/10 | N/A | Nao | AMARELO — bug ativo |
| `/inteligencia/adocao` | 7/10 | 3/4 (1 falha) | SIM — page_views ausente | VERMELHO |
| `/inteligencia/feedback` | 8/10 | 8/8 (todos passaram) | SIM — feedback ausente | VERMELHO |
| `/inteligencia/roadmap` | 7/10 | 4/4 (todos passaram condicionalmente) | SIM — roadmap_items ausente | VERMELHO |
| `/orquestrador` | 7/10 | 5/5 (todos passaram) | Nao (hos_jobs ja existe) | AMARELO |

> Nota: feedback e roadmap aparecem como "todos passaram" porque os testes foram escritos para aceitar o estado MigrationBanner como valido. O bloqueio de DB e confirmado pelo agente de integridade independente.

---

## Bugs Criticos (por prioridade)

### BUG-001 — CRITICO — Migrations 067-069 nao aplicadas ao Supabase remoto

**Severidade:** CRITICO (bloqueia ship de 3 rotas)
**Confirmado por:** Playwright Tester (falha no teste "page_views table exists") + Data Integrity Auditor
**Sintoma:** As rotas /inteligencia/adocao, /inteligencia/feedback e /inteligencia/roadmap exibem `MigrationBanner` com o DDL SQL exposto para todos os usuarios, incluindo nao-founders. O conteudo real dessas rotas nunca e renderizado.
**Causa raiz:** As migrations existem no repositorio local em `/Users/henriqueguimaraes/Desktop/_HOS/_ORKESTRI/_KPH-OS/supabase/migrations/` (arquivos 067, 068, 069) mas nao foram executadas no banco remoto.
**Impedimento adicional:** O prefixo `008` esta duplicado (`008_events.sql` e `008_self_select_ponto.sql`), o que faz `supabase db push` falhar. O comando nao pode ser usado — as migrations devem ser aplicadas via SQL Editor do painel Supabase.

**Acao:** Ver Plano de Acao, passos 1-4.

---

### BUG-002 — CRITICO — String literal `{periodo}` renderizada em /cross (EmptyState)

**Severidade:** CRITICO (bug de regressao de UX confirmado)
**Confirmado por:** UX Reviewer
**Sintoma:** A pagina `/inteligencia/cross` exibe o texto literal `{periodo}` no componente EmptyState em vez do valor interpolado do periodo selecionado.
**Causa raiz:** Variavel nao interpolada no template string ou prop nao passada corretamente ao componente EmptyState.
**Acao:** Localizar o componente EmptyState em `src/app/inteligencia/cross/` e corrigir a interpolacao. Procurar por `"{periodo}"` ou `'{periodo}'` (string literal com chaves) em vez de `{periodo}` (expressao JSX).

---

### BUG-003 — MAIOR — MigrationBanner expoe DDL SQL para usuarios nao-founder

**Severidade:** MAIOR (vazamento de informacao de schema)
**Confirmado por:** UX Reviewer
**Rotas afetadas:** adocao, feedback, roadmap
**Sintoma:** O componente `MigrationBanner` exibe o DDL SQL completo (`CREATE TABLE`, `CREATE INDEX`, `CREATE POLICY`) para qualquer usuario autenticado, nao apenas founders.
**Acao:** Adicionar guard de role no componente antes de renderizar o bloco `<pre>` com SQL. Exibir apenas mensagem generica ("Esta funcionalidade esta em manutencao") para usuarios sem role `founder`.

---

### BUG-004 — MAIOR — Header da rota /wbr delegado para client component

**Severidade:** MAIOR (quebra padrao arquitetural)
**Confirmado por:** UX Reviewer
**Sintoma:** O arquivo `page.tsx` de `/inteligencia/wbr` delega a renderizacao do header para um client component, quebrando o padrao estabelecido nas demais rotas onde `page.tsx` e um Server Component e renderiza o header diretamente.
**Acao:** Mover o header de volta para `src/app/inteligencia/wbr/page.tsx` como JSX estatico. O client component deve receber apenas os dados dinamicos como props.

---

### BUG-005 — MAIOR — Tabelas sem overflow-x em mobile (4 rotas)

**Severidade:** MAIOR (regressao de UX em dispositivos moveis)
**Confirmado por:** UX Reviewer
**Rotas afetadas:** adocao, feedback, roadmap, orquestrador
**Sintoma:** Tabelas de dados nao possuem `overflow-x: auto` no container pai, causando overflow horizontal e conteudo cortado em viewports menores que 768px.
**Acao:** Envolver cada `<table>` em `<div className="overflow-x-auto">` nos respectivos client components.

---

### BUG-006 — MAIOR — Grid do roadmap fixo em 3 colunas sem breakpoints responsivos

**Severidade:** MAIOR (quebra em mobile)
**Confirmado por:** UX Reviewer
**Rota afetada:** roadmap
**Sintoma:** O kanban usa `grid-cols-3` fixo sem classes responsivas (`sm:grid-cols-1`, `md:grid-cols-2`).
**Acao:** Alterar a classe do grid em `src/app/inteligencia/roadmap/` para `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`.

---

## Divida Tecnica

### DT-001 — Violacao sistematica de paleta de cores (todas as 7 rotas)

**Tipo:** Divida de design system
**Confirmado por:** UX Reviewer
**Descricao:** Todos os 7 client files usam cores Tailwind arbitrarias fora da paleta KPH/HOS — especificamente `#15803D` (verde severity), `#A16207` (amarelo severity) e `#B91C1C` (vermelho severity). A paleta oficial (Carvao, Creme, Brasa, Pedra, Ouro) nao possui equivalentes de severity mapeados.
**Impacto:** Qualquer revisao de marca ou mudanca de tema exigira busca manual em todos os arquivos. Inconsistencia visual entre o modulo Inteligencia e o restante do KPH-OS.
**Solucao proposta:** Criar `src/lib/severity.ts` com tokens de severity mapeados para as cores aprovadas, e substituir os valores hex hardcoded por referencias ao token. Exemplo:

```typescript
// src/lib/severity.ts
export const severity = {
  success: 'text-[#15803D] bg-[#F0FDF4]',  // temporario — validar com HOS brand
  warning: 'text-[#A16207] bg-[#FEFCE8]',
  error:   'text-[#B91C1C] bg-[#FEF2F2]',
} as const
```

Essa centralizacao permite trocar as cores em um unico lugar quando a paleta for oficializada.

---

### DT-002 — Label do kanban "Entregue" vs "Concluido"

**Tipo:** Inconsistencia de nomenclatura
**Confirmado por:** Playwright Tester (anotacao no teste de colunas do kanban)
**Descricao:** O codigo usa `"Entregue"` como label da terceira coluna do kanban, mas o teste e o brief mencionam `"Concluido"` como alternativa esperada. O teste foi ajustado para aceitar `"Entregue"`, mas a inconsistencia deve ser resolvida definitivamente.
**Acao:** Definir o label canonico com Ike e aplicar em codigo e testes.

---

### DT-003 — Sem seed de dados para roadmap_items

**Tipo:** Divida de ambiente de desenvolvimento
**Confirmado por:** Playwright Tester
**Descricao:** Mesmo apos a migration ser aplicada, a tabela `roadmap_items` estara vazia. Os testes do kanban passam condicionalmente (aceitam estado vazio), mas o produto nao tera valor demonstravel sem dados iniciais.
**Acao:** Criar um arquivo de seed SQL com os 10 itens de roadmap mencionados no brief e aplica-lo via SQL Editor apos a migration.

---

## RLS / Seguranca

Tres politicas RLS precisam de correcao. As correcoes abaixo devem ser aplicadas via SQL Editor do Supabase, na mesma sessao das migrations 067-069.

### Problema 1 — page_views INSERT sem clausula `TO authenticated`

**Risco:** Ambiguidade de intencao. A politica atual funciona na pratica (NULL=NULL e falsy em PostgreSQL), mas nao e explicita quanto ao role alvo. Uma mudanca futura nas configuracoes do Supabase pode ativar INSERTs anonimos.

```sql
DROP POLICY IF EXISTS "insert_own" ON public.page_views;
CREATE POLICY "insert_own" ON public.page_views
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
```

### Problema 2 — roadmap_items SELECT permite leitura anonima

**Risco:** `USING (true)` sem `TO authenticated` permite que qualquer requisicao anonima leia o roadmap. Isso pode expor informacao estrategica antes do login.

```sql
DROP POLICY IF EXISTS "select_roadmap" ON public.roadmap_items;
CREATE POLICY "select_roadmap" ON public.roadmap_items
  FOR SELECT TO authenticated
  USING (true);
```

### Problema 3 — feedback INSERT sem clausula `TO authenticated`

**Risco:** Mesmo padrao do problema 1. Sem `TO authenticated`, a intencao da politica nao e auditavel.

```sql
DROP POLICY IF EXISTS "insert_feedback" ON public.feedback;
CREATE POLICY "insert_feedback" ON public.feedback
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
```

---

## Plano de Acao

Os passos abaixo estao ordenados por dependencia. Ike deve executar na sequencia indicada.

**Passo 1 — Aplicar migration 067 (page_views) via SQL Editor do Supabase**
- Abrir o SQL Editor no painel do projeto Supabase (producao)
- Copiar e executar o conteudo de `supabase/migrations/067_*.sql` do repositorio `_KPH-OS`
- Verificar que a tabela `public.page_views` aparece no Table Editor

**Passo 2 — Aplicar migration 068 (feedback) via SQL Editor**
- Copiar e executar o conteudo de `supabase/migrations/068_*.sql`
- Verificar que `public.feedback` aparece no Table Editor

**Passo 3 — Aplicar migration 069 (roadmap_items) via SQL Editor**
- Copiar e executar o conteudo de `supabase/migrations/069_*.sql`
- Verificar que `public.roadmap_items` aparece no Table Editor

**Passo 4 — Aplicar as 3 correcoes de RLS via SQL Editor (mesmo painel)**
- Executar os 3 blocos SQL da secao RLS/Seguranca acima, em ordem
- Confirmar no painel Authentication > Policies que cada politica aparece com `TO authenticated`

**Passo 5 — Criar seed de roadmap_items**
- Escrever 10 itens de roadmap representativos em SQL INSERT
- Executar via SQL Editor
- Confirmar que a rota /inteligencia/roadmap exibe os cards no kanban

**Passo 6 — Corrigir bug de interpolacao em /cross**
- Em `src/app/inteligencia/cross/`, localizar o componente EmptyState
- Corrigir a string `"{periodo}"` para a expressao JSX `{periodo}`
- Verificar na rota /inteligencia/cross que o periodo correto aparece no estado vazio

**Passo 7 — Corrigir MigrationBanner para nao expor DDL a nao-founders**
- Nos 3 componentes MigrationBanner (adocao, feedback, roadmap), adicionar guard de role
- Exibir apenas mensagem generica para usuarios sem role `founder`

**Passo 8 — Mover header de /wbr para page.tsx (Server Component)**
- Refatorar `src/app/inteligencia/wbr/page.tsx` para renderizar o header diretamente
- Remover a responsabilidade de header do client component correspondente

**Passo 9 — Adicionar overflow-x: auto nas tabelas (4 rotas)**
- Em adocao, feedback, roadmap e orquestrador: envolver `<table>` em `<div className="overflow-x-auto">`

**Passo 10 — Corrigir grid do roadmap para responsivo**
- Alterar classe do kanban de `grid-cols-3` para `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

**Passo 11 — Criar severity.ts e unificar tokens de cor**
- Criar `src/lib/severity.ts` com os 3 tokens de severity
- Substituir os 7 ocorrencias de `#15803D`, `#A16207`, `#B91C1C` hardcoded por referencias ao token
- (Este passo pode ser feito apos o ship inicial — e divida tecnica, nao bloqueador)

**Passo 12 — Re-executar suite Playwright apos passos 1-5**
- Rodar `npx playwright test tests/smoke.spec.ts` com o servidor em `localhost:3007`
- Todos os 22 testes devem passar (resultado esperado: 22/22)

---

## Resultados dos Testes Playwright

**Arquivo:** `tests/smoke.spec.ts`
**Config:** `playwright.config.ts` (criado pelo agente, nao existia anteriormente)
**Total de testes:** 22
**Resultado na execucao do agente:** 21 passaram / 1 falhou

| Suite | Testes | Resultado |
|---|---|---|
| `/inteligencia/feedback` | 8/8 | Todos passaram |
| `/inteligencia/roadmap` | 4/4 | Todos passaram (condicionalmente — aceitam MigrationBanner) |
| `/orquestrador` | 5/5 | Todos passaram |
| `/inteligencia/adocao` | 3/4 | **1 falhou** |

**Teste que falhou:** `"page_views table exists — MigrationBanner with SQL is NOT shown"`
**Causa:** Tabela `public.page_views` nao existe no banco remoto. A migration 067 nao foi aplicada.
**Acao necessaria:** Aplicar migration via SQL Editor (Passo 1 do plano de acao) e re-executar.

---

## Veredicto de Ship Readiness

**STATUS: VERMELHO**

**Criterios para VERMELHO:**
- Tres rotas (adocao, feedback, roadmap) estao completamente inoperantes em producao por ausencia de migrations — nenhum usuario consegue ver o conteudo dessas paginas
- Um bug de string nao interpolada esta ativo e visivel em /cross
- Politicas RLS com ambiguidade de seguranca existem nas tres tabelas que nao foram migradas

**Criterios para passar para AMARELO** (ship com ressalvas):
- Passos 1 a 7 do plano de acao executados
- Suite Playwright passando 22/22

**Criterios para passar para VERDE** (ship sem ressalvas):
- Passos 1 a 10 executados
- Suite Playwright passando 22/22
- Tokens de severity centralizados (Passo 11)
- Nenhuma ocorrencia de DDL SQL visivel para usuarios nao-founder
