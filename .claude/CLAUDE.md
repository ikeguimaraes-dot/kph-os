# KPH OS — Guia Permanente do Claude Code

> Leia este arquivo inteiro antes de fazer qualquer coisa. É a memória completa do projeto.

---

## 1. VISÃO GERAL

**KPH OS** é o ERP de hospitalidade multi-tenant da KPH Participações — holding que opera restaurantes e eventos em São Paulo. O sistema centraliza RH, financeiro, compras, operação, comercial e marca para todas as unidades do grupo.

- **URL de produção:** https://kph-os.vercel.app
- **Repositório:** github.com/ikeguimaraes-dot/kph-os (privado)
- **Supabase project ID:** iqgrvptrtphvbmvrqntm
- **Supabase URL:** https://iqgrvptrtphvbmvrqntm.supabase.co

**Princípio central do Orquestrador HOS:** nenhuma automação de IA age em produção sem aprovação humana. Agentes detectam → criam `hos_runs` → humano aprova ou rejeita → ação é executada.

### Marcas operadas
meet-eat · madonna-cucina · match-point · the-forge · klauss · pipokae · pipou-academy · sushi-muu · rojo · burguer · trato

---

## 2. STACK TÉCNICA

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16.2.4 (App Router) |
| UI | React 19.2.4, TypeScript strict |
| Estilos | Tailwind v4 (sem config, usa `@import "tailwindcss"`) |
| Banco | Supabase (PostgreSQL + RLS + Storage) |
| Auth | Supabase Auth (email/senha) + bypass UUID para dev |
| Deploy | Vercel Pro — push para `main` = deploy automático |
| IA | Claude API — `claude-sonnet-4-20250514` |
| Notificações | Discord (webhook + bot ClaudeBridge) |
| Gráficos | Recharts ^3 |
| Ícones | Lucide React ^1 |
| PDF | @react-pdf/renderer ^4 |
| Forms | React Hook Form + Zod v4 |
| CI/CD | GitHub Actions + Vercel |

### Dependências principais (package.json)
```json
"next": "16.2.4",
"react": "19.2.4",
"@supabase/ssr": "^0.10.2",
"@supabase/supabase-js": "^2.104.1",
"lucide-react": "^1.11.0",
"recharts": "^3.8.1",
"react-hook-form": "^7.74.0",
"zod": "^4.3.6",
"date-fns": "^4.1.0",
"xlsx": "^0.18.5"
```

### TypeScript config crítica (tsconfig.json)
```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitReturns": true
}
```
`noUncheckedIndexedAccess` = acessar `array[i]` retorna `T | undefined`. Use `array[i]!` (non-null assertion) quando você sabe que o índice existe.

---

## 3. IDs IMPORTANTES

```
Bypass UUID:        00000000-0000-0000-0000-000000000001  (bypass@kph.os — role founder)
Ike UUID:           ac559fa1-f10b-4ec4-9f4b-fafbc881a884
KPH group ID:       0ed2ef3a-39e8-4c95-ad2d-63a5d2b06c70
Meet & Eat unit ID: 674eac8c-5a38-4a42-aa60-0a666387909b
```

**NUNCA** usar a string literal `"bypass"` como `user_id` — PostgreSQL rejeita o cast para UUID. O bypass user foi seedado em `039_seed_bypass_user.sql`.

---

## 4. ARQUITETURA

### Hierarquia organizacional
```
groups (KPH Participações)
  └── brands (Meet & Eat, Madonna Cucina, Klauss, ...)
        └── units (Meet & Eat - Moema, Madonna - Itaim, ...)
              └── employees (colaboradores)
```

### Estrutura de pastas
```
src/
  app/
    (auth)/
      login/                    ← página de login
    (dashboard)/                ← layout autenticado com Sidebar
      dashboard/                ← página inicial com KPIs
      campanhas/                ← campanhas de marketing
      cardapio/                 ← cardápio digital com ficha técnica
      cliente/                  ← CRM de clientes
      comercial/
        funil/                  ← funil de vendas
        reservas/               ← gestão de reservas
        serena/                 ← integração com agente IA Serena
      compras/                  ← pedidos + fornecedores + estoque + cotações
      eventos/                  ← O.S. de eventos (brigada, menu, etc.)
      financeiro/               ← DRE, fluxo, contas a pagar/receber, CMV
      inteligencia/
        metas/                  ← KPIs por marca/período
        wbr/                    ← Weekly Business Review
        roadmap/                ← roadmap interno
        adocao/                 ← adoção do sistema
      marca/                    ← brandbook, canais, reputação
      marcas/                   ← diretório de marcas com links externos
      operacao/
        auditorias/             ← checklists de qualidade
        mapa/                   ← mapa de mesas em tempo real
        performance/            ← KPIs de operação
        vendedores/             ← ranking de vendedores
      orquestrador/             ← painel HOS (runs, insights, aprovações)
      pessoas/
        colaboradores/          ← CRUD + perfil detalhado por abas
        headcount/              ← análise de headcount
        escala/                 ← grade de turnos mensal
        ponto/                  ← registro de ponto + resumo
        ferias/                 ← gestão de férias
        faltas/                 ← registro de faltas
        horas-extras/           ← controle de HE
        disciplina/             ← advertências e score
        holerites/              ← geração e visualização de holerites
        gorjetas/               ← sistema de pontos por cargo
        vale-transporte/        ← controle de VT
        treinamentos/           ← templates + registros de treinamento
        avaliacoes/             ← avaliação de desempenho
          ciclos/               ← ciclos de avaliação 360°
          9box/                 ← matriz 9Box
        pdi/                    ← Plano de Desenvolvimento Individual
        reunioes/               ← Reuniões 1:1
        organograma/            ← árvore hierárquica (manager_id)
          configurar/           ← configuração de gestores
        onboarding/             ← runs de onboarding
          templates/            ← templates reutilizáveis
        feedback/               ← feedback contínuo entre colaboradores
        documentos/             ← documentos trabalhistas (Supabase Storage)
        importacao/             ← importação CSV do Totvs
        relatorio-ponto/        ← relatório mensal importado do Totvs
      recrutamento/
        vagas/                  ← pipeline de vagas
        candidatos/             ← base de candidatos
    api/
      auth-debug/               ← debug de sessão
      discord/
        interactions/           ← slash commands /aprovar /rejeitar /hos
        register/               ← registro de comandos no Discord
      holerites/[id]/pdf/       ← geração de PDF do holerite
      holerites/generate/       ← gera holerite programaticamente
      orchestrator/
        cron/compliance/        ← cron 0 8 * * * — Compliance Documental
        cron/ferias/            ← cron 0 8 * * 1 — Férias Monitor
        cron/folha/             ← cron 0 8 25 * * — Folha Validator
        cron/onboarding/        ← cron 0 9 * * * — Onboarding Checker
        escalate/               ← cron */30 * * * * — escalação de runs
        github-webhook/         ← recebe eventos de PR do GitHub
        qa-callback/            ← recebe resultado dos smoke tests
        webhook/                ← recebe deployment_status do Vercel
      ponto/punch/              ← endpoint do app mobile para bater ponto
    auth/
      callback/                 ← callback OAuth do Supabase
      sign-out/                 ← logout
    ponto/                      ← app de ponto (layout isolado, sem sidebar)
  components/
    avaliacoes/                 ← CriteriosEditor (form dinâmico de critérios)
    dashboard/                  ← KpiCard, AlertasPanel, ProgressBar, etc.
    eventos/                    ← EventForm, EventDetail, BrigadaSection, etc.
    financeiro/                 ← LancamentoForm, DreCard, AprovacaoActions, etc.
    pessoas/                    ← EmployeeForm, EmployeeTable, PayslipDetail, etc.
    ponto/                      ← PontoApp, CameraCapture (app mobile web)
    shell/                      ← Sidebar, TopBar, NotificationBell
    ui/                         ← shadcn/ui: button, input, dialog, badge, etc.
  lib/
    auth/
      server.ts                 ← requireUser(), getCurrentUser(), requireRole()
      unit.ts                   ← getCurrentUnit()
      context.tsx               ← AuthProvider, useAuth(), useUnit()
    supabase/
      server.ts                 ← createSupabaseServerClient(), createServiceClient()
      client.ts                 ← getBrowserClient() (para componentes client)
      proxy.ts                  ← middleware helper para refresh de token
    orquestrador/
      actions.ts                ← createRun, submitRunDecision, autoApproveRun, etc.
      commander.ts              ← executeCommander (Discord conversacional)
      agents/
        code-review.ts          ← executeCodeReview
        compliance-documental.ts← runComplianceDocumental
        ferias-monitor.ts       ← runFeriasMonitor
        folha-validator.ts      ← runFolhaValidator
        onboarding-checker.ts   ← runOnboardingChecker
    discord/
      notify.ts                 ← sendDiscordMessage
      verify.ts                 ← verificação Ed25519 de requests
    pessoas/                    ← actions RH (ponto, documentos, headcount, etc.)
    result.ts                   ← ActionResult<T> (discriminated union)
    format.ts                   ← formatadores de data/moeda
    utils.ts                    ← cn() (tailwind-merge + clsx)
  types/
    database.ts                 ← tipos gerados pelo Supabase CLI
    pessoas.ts                  ← tipos adicionais de RH
```

---

## 5. PADRÕES OBRIGATÓRIOS

### 5.1 Clientes Supabase

```typescript
// ✅ CORRETO: Server Actions e Route Handlers — usa service role, bypassa RLS
import { createServiceClient } from "@/lib/supabase/server";
const supabase = createServiceClient(); // síncrono, retorna SupabaseClient | null

// ✅ CORRETO: Server Components — usa sessão do cookie, RLS aplica
import { createSupabaseServerClient } from "@/lib/supabase/server";
const supabase = await createSupabaseServerClient(); // assíncrono

// ❌ NUNCA usar createSupabaseServerClient() em Server Actions para mutações
// ❌ NUNCA expor SUPABASE_SERVICE_ROLE_KEY em componentes client
```

**Regra de ouro:** `createServiceClient()` em tudo que escreve no banco. `createSupabaseServerClient()` em tudo que só lê e precisa do contexto de sessão do usuário.

### 5.2 Params em Next.js 16

```typescript
// ✅ CORRETO — params é Promise em Next.js 16
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // ...
}

// ✅ searchParams também
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const { page = "1", status } = await searchParams;
}

// ❌ ERRADO — Next.js 16 quebra se não fizer await
export default async function Page({ params }: { params: { id: string } }) { ... }
```

### 5.3 Hydration guard

Componentes client que usam dados dinâmicos ou interagindo com APIs SSR-sensíveis precisam do guard:

```typescript
"use client";
const [mounted, setMounted] = useState(false);
useEffect(() => { setMounted(true); }, []);
if (!mounted) return null; // ou skeleton
```

Sem isso, você pode ter erros de hydration mismatch entre SSR e CSR.

### 5.4 ActionResult — padrão para Server Actions

```typescript
// src/lib/result.ts
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// Em Server Actions:
"use server";
export async function createSomething(input: Input): Promise<ActionResult<string>> {
  try {
    const supabase = createServiceClient();
    if (!supabase) return { ok: false, error: "Serviço indisponível" };
    const { data, error } = await supabase.from("tabela").insert({ ... } as never).select("id").single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data.id };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// No cliente:
const r = await createSomething(input);
if (!r.ok) { setError(r.error); return; }
router.push("/sucesso");
```

### 5.5 Cast `as never` em inserts

O Supabase TypeScript SDK às vezes não consegue inferir o tipo de um insert quando a tabela tem tipos complexos ou quando a tabela é nova (não está nos tipos gerados). Use:

```typescript
await supabase.from("nova_tabela").insert({ campo: valor } as never);
// ou
await (supabase as any).from("nova_tabela").insert({ campo: valor });
```

Use `(supabase as any)` quando a tabela não existe em `src/types/database.ts` (tabelas adicionadas por migration recente, antes de regenerar os tipos).

### 5.6 getAuthorizedUnitIds — segurança multi-unit

Todo Server Action que lê ou escreve dados de unit deve verificar autorização:

```typescript
async function getAuthorizedUnitIds(): Promise<string[] | null> {
  const user = await requireUser();
  const supabase = createServiceClient();
  if (!supabase) return null;
  const { data: roles } = await supabase
    .from("user_roles")
    .select("unit_id")
    .eq("user_id", user.id);
  const unitIds = (roles ?? [])
    .map((r: any) => r.unit_id)
    .filter((id: unknown): id is string => typeof id === "string" && id.length > 0);
  return unitIds.length > 0 ? unitIds : null; // null = sem restrição (founder)
}

// Uso:
const unitIds = await getAuthorizedUnitIds();
let query = supabase.from("tabela").select("*");
if (unitIds) query = query.in("unit_id", unitIds);
```

Retorna `null` quando o user é founder (sem restrição) — `unitIds.length === 0` quando o usuário tem roles mas nenhuma unit específica, o que indica acesso a tudo.

### 5.7 Timezone

Sempre usar timezone de São Paulo para datas e horários:

```typescript
const agora = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
```

Datas de competência são sempre `YYYY-MM-DD` no banco (DATE). Nunca guardar DateTime onde Date basta.

### 5.8 Componentes client obrigatório

Todo componente com `useState`, `useEffect`, `useRouter`, `onClick`, etc. DEVE ter `"use client"` na primeira linha. Server Components não têm estado.

### 5.9 export const dynamic

Páginas que leem dados do banco (Server Components) precisam de:

```typescript
export const dynamic = "force-dynamic";
```

Sem isso, o Next.js pode fazer cache estático e servir dados desatualizados.

### 5.10 Suspense em Server Components com dados

Quando uma page tem sub-componentes que fazem queries lentas, use Suspense:

```tsx
import { Suspense } from "react";

export default async function Page() {
  return (
    <div>
      <Suspense fallback={<div>Carregando...</div>}>
        <DadosLentos />
      </Suspense>
    </div>
  );
}
```

---

## 6. AUTENTICAÇÃO

### Fluxo SSR completo

1. **Middleware** (`src/lib/supabase/proxy.ts`) — valida JWT em toda request, injeta `x-middleware-set-cookie` se token foi renovado
2. **`requireUser()`** — lê sessão via cookie. Se sem sessão, retorna o bypass user (ID fixo) — AUTH DESATIVADO para dev
3. **`getCurrentUnit()`** — lê cookie `kph_unit_id` para saber qual unidade está selecionada
4. **`AuthProvider`** — Client Component no layout do dashboard. Recebe user + units do servidor, persiste `unitId` em localStorage + cookie. Expõe `useAuth()` e `useUnit()` para componentes client

### requireUser() em modo dev

```typescript
// AUTH DESATIVADO: quando não há sessão, retorna bypass user
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (user) return user;
  return {
    id: "00000000-0000-0000-0000-000000000001",
    email: "bypass@kph.os",
    roles: [{ role: "founder", unitId: null, brandId: null, groupId: null }],
  };
}
```

### Roles disponíveis (tabela `roles`)

| Role | Descrição |
|------|-----------|
| founder | Fundador — acesso total |
| cfo | CFO — financeiro + relatórios |
| gm | Gerente Geral — unidade completa |
| pessoas | RH — módulo pessoas |
| chef | Chef — cardápio + estoque |
| comprador | Compras — fornecedores + estoque |
| colaborador | Colaborador — acesso básico |
| socio_readonly | Sócio — somente leitura |
| comercial | Comercial — vendas + eventos |
| operacional | Operacional — execução de eventos |

### Helpers RBAC (PostgreSQL — SECURITY DEFINER)

Criados em `001_base_schema.sql`, rodam com privilégios do owner — evitam recursão de RLS:

- `kph_is_founder()` — true se o usuário tem role founder
- `kph_has_role_for_unit(p_unit_id)` — true se tem acesso à unidade (diretamente ou via brand/group)
- `kph_has_role_for_brand(p_brand_id)` — true se tem acesso à marca
- `kph_has_role_for_group(p_group_id)` — true se tem acesso ao grupo
- `kph_is_founder_or_cfo()` — founder ou CFO

---

## 7. BANCO DE DADOS — SCHEMA COMPLETO

### Migrations (001–059)

| Migration | Descrição |
|-----------|-----------|
| 001_base_schema | groups, brands, units, roles, user_roles, audit_log + helpers RBAC (kph_is_founder etc.) |
| 002_rls | Políticas RLS para groups, brands, units, user_roles, audit_log |
| 003_pessoas | employees, shifts, time_clock_punches, time_bank_balance, payslips, cct_versions |
| 004_payslips_policies | Políticas RLS adicionais para payslips |
| 005_employees_expand | Colunas extras em employees (foto_url, bio, etc.) |
| 006_ponto_policies | Políticas RLS para ponto (self-select: colaborador vê próprio ponto) |
| 007_marcas_hos | brands operacionais (11 marcas), brand_links (portais externos consolidados) |
| 008_events | events, event_staff, event_menu_items, event_attachments, restaurant_tables |
| 008_self_select_ponto | Policy permitindo colaborador ver próprio ponto via `employee_auth` |
| 009_dashboard_views | Views de dashboard (v_dre_consolidado, v_eventos_kpi, v_headcount_por_marca) |
| 010_financeiro | financial_periods, lancamentos, cost_entries + views DRE/gap/CMV |
| 011_employees_rh_expansion | +23 colunas em employees + 6 tabelas: vacations, absences, overtime_records, transport_vouchers, warnings, job_openings |
| 019_compras | purchase_orders, purchase_order_items, suppliers, stock_movements |
| 020_clientes | clients (CRM) com campos origin, segmento, etc. |
| 021_treinamentos | training_templates, training_records (com validade calculada via snapshot) |
| 022_avaliacoes | performance_templates (critérios em JSONB), performance_reviews |
| 023_metas | brand_targets (KPIs por marca/período), target_notes |
| 024_notificacoes | notifications (gerada pelo servidor via service_role) |
| 025_ficha_tecnica | recipe_items (ficha técnica de prato), recipe_notes |
| 026_fix_rls_multi_unit | Fix em kph_has_role_for_unit — usuário brand-level agora acessa units da brand |
| 027_employee_documents | employee_documents (bucket Supabase Storage: 'employee-documents') |
| 028_ingredientes | ingredients, ingredient_price_history, recipe_items, recipe_notes (refactor) |
| 029_quality_checklists | quality_checklists, checklist_records (checklists de operação) |
| 030_restaurant_tables | restaurant_tables com status/área |
| 031_reservations | reservations (mesa + pax + origem + status) |
| 032_price_quotes | price_quotes, price_quote_items (cotações de compra) |
| 033_orchestrator | hos_jobs, hos_runs, hos_approvals + RLS + trigger updated_at |
| 034_ponto_mensal | ponto_mensal (importação CSV do Totvs, 1 linha/colaborador/período) |
| 035_gorjetas | gorjeta_cargo_pontos, gorjeta_periodos, gorjeta_dias (v1 — substituída) |
| 035_hos_insights | hos_insights (relatórios semanais gerados pela Claude API) |
| 036_gorjetas_v2 | Gorjetas v2 — DROP + recreate das 3 tabelas com modelo de pontos por dia |
| 037_controle_vagas | +colunas em job_openings: status, recrutador, sla_dias, motivo |
| 038_hos_runs_rls_update | Adiciona WITH CHECK na policy UPDATE de hos_runs |
| 039_seed_bypass_user | Seed do bypass UUID em auth.users (fix FK para hos_approvals) |
| 040_hos_runs_archived_at | ADD COLUMN archived_at + index parcial + arquiva runs antigos |
| 041_hos_jobs_auto_approve | ADD COLUMN auto_approve em hos_jobs, TRUE para qa_preview e code_review |
| 042_code_review_no_auto | Reverte: code_review → auto_approve = FALSE (executa agente real) |
| 043_employee_auth | employee_auth (auth mobile: CPF + password_hash, sem auth.users) |
| 044_mobile_views | View tips_records (agregação de gorjeta por colaborador/mês para app mobile) |
| 045_theo_tickets | theo_tickets (tickets do agente SAC Theo via WhatsApp) |
| 046_hos_runs_deployment_id | ADD COLUMN deployment_id + UNIQUE INDEX (deduplicação de webhooks Vercel) |
| 047_candidates | candidates (pipeline R&S web: novo → triagem → entrevista → aprovado) |
| 048_candidatos_maya | candidatos_maya (leads WhatsApp do agente Maya, separado do pipeline web) |
| 049_compliance_documental | Seed hos_job: compliance_documental (auto_approve=false) |
| 050_hos_runs_title | ADD COLUMN title em hos_runs (título legível para o painel) |
| 051_ferias_monitor | Seed hos_job: ferias_monitor (auto_approve=false) |
| 052_folha_validator | Seed hos_job: folha_validator (auto_approve=false) |
| 053_onboarding_checker | Expande CHECK constraint de employee_documents.tipo (+foto_3x4) + seed onboarding_checker |
| 054_feedbacks | feedbacks (feedback contínuo entre colaboradores: positivo/desenvolvimento) |
| 055_avaliacoes_360_9box | +tipo_avaliador e +anonimo em performance_reviews + avaliacao_ciclos + avaliacao_participantes |
| 056_pdi | pdis (Plano de Desenvolvimento Individual) + pdi_metas |
| 057_reunioes_1on1 | reunioes_1on1 + reuniao_action_items |
| 058_organograma | ALTER employees ADD COLUMN manager_id UUID REFERENCES employees(id) |
| 059_onboarding | onboarding_templates + onboarding_tarefas + onboarding_runs + onboarding_checklist |

### Tabelas por domínio

#### Core multi-tenant
```sql
groups(id, name, slug)
brands(id, group_id, name, slug, color, active)
units(id, brand_id, name, address, whatsapp_number, active)
roles(id, name, description)
user_roles(id, user_id, role_id, unit_id, brand_id, group_id)
audit_log(id, user_id, action, resource, resource_id, old_data, new_data)
brand_links(id, brand_id, kind, url, label, ordem)
notifications(id, user_id, tipo, titulo, mensagem, lida, created_at)
```

#### RH — colaboradores
```sql
employees(
  id, unit_id, user_id, nome, sobrenome, cpf, funcao,
  salario_base, data_admissao, data_demissao, ativo,
  banco, agencia, conta, tipo_conta, pix,
  manager_id,  -- 058: organograma
  -- +23 colunas de 011: celular, email, endereco, cep, rg, cnh,
  -- data_nascimento, genero, estado_civil, filhos, escolaridade,
  -- tipo_contrato, carga_horaria, sindicato, ctps_expedicao, etc.
)
shifts(id, employee_id, unit_id, data, hora_inicio, hora_fim, tipo, labor_cost)
time_clock_punches(id, employee_id, tipo, timestamp_punch, latitude, longitude, aprovado)
time_bank_balance(id, employee_id, saldo_minutos, ultimo_calculo)
payslips(id, employee_id, competencia, salario_base, horas_extras, gorjeta, liquido, status, pdf_url)
vacations(id, employee_id, data_inicio, data_fim, status, tipo)
absences(id, employee_id, data, tipo, motivo, justificada)
overtime_records(id, employee_id, data, horas, aprovado)
transport_vouchers(id, employee_id, competencia, valor, dias)
warnings(id, employee_id, tipo, descricao, gravidade, data)
employee_documents(id, employee_id, tipo, nome, file_path, validade)
employee_auth(id, employee_id, cpf, password_hash, is_active, last_login)
ponto_mensal(id, unit_id, employee_id, matricula, nome, periodo, ...)
feedbacks(id, unit_id, de_employee_id, para_employee_id, tipo, categoria, mensagem, anonimo)
```

#### Gorjetas
```sql
gorjeta_cargo_pontos(id, unit_id, cargo, pontos, ativo)
gorjeta_periodos(id, unit_id, inicio, fim, valor_total, encerrado)
gorjeta_dias(id, periodo_id, employee_id, data, pontos, valor_calculado)
```

#### Avaliação e desenvolvimento
```sql
performance_templates(id, brand_id, unit_id, nome, criterios JSONB, ativo)
performance_reviews(id, employee_id, template_id, nota_geral, respostas JSONB, tipo_avaliador, anonimo)
avaliacao_ciclos(id, unit_id, nome, template_id, status, data_inicio, data_fim)
avaliacao_participantes(id, ciclo_id, avaliado_id, avaliador_id, tipo, status, review_id)
pdis(id, unit_id, employee_id, titulo, status, data_inicio, data_fim, avaliacao_id)
pdi_metas(id, pdi_id, descricao, prazo, status, progresso)
reunioes_1on1(id, unit_id, gestor_id, colaborador_id, data_reuniao, duracao_min, status, notas)
reuniao_action_items(id, reuniao_id, descricao, responsavel_id, prazo, status)
```

#### Treinamentos
```sql
training_templates(id, brand_id, unit_id, nome, categoria, validade_dias, conteudo)
training_records(id, employee_id, template_id, data_conclusao, validade_dias_snapshot, validade_ate GENERATED, instrutor)
```

#### Onboarding (059)
```sql
onboarding_templates(id, unit_id, nome, descricao, ativo)
onboarding_tarefas(id, template_id, titulo, descricao, responsavel CHECK IN('rh','gestor','colaborador','ti'), prazo_dias, ordem)
onboarding_runs(id, unit_id, employee_id, template_id, status CHECK IN('em_andamento','concluido','cancelado'), data_inicio)
onboarding_checklist(id, run_id, tarefa_id, status CHECK IN('pendente','concluido','ignorado'), concluido_em, concluido_por)
```

#### Recrutamento
```sql
job_openings(id, unit_id, titulo, funcao, status, recrutador, sla_dias, motivo, ...)
candidates(id, nome, telefone, area_interesse, status, source)
candidatos_maya(id, nome, telefone, status, source)  -- leads do agente Maya
```

#### Orquestrador HOS
```sql
hos_jobs(id, name, slug UNIQUE, description, auto_approve, is_active)
hos_runs(id, job_id, status, payload JSONB, result_data JSONB, logs TEXT[], title, deployment_id, archived_at, created_at)
hos_approvals(id, run_id, user_id, decision, rationale, created_at)
hos_insights(id, period_start, period_end, report_md, metrics JSONB)
```

**Status do hos_runs:** `pending → running → awaiting_approval → approved | rejected | failed`

#### Agentes WhatsApp
```sql
theo_tickets(id, employee_id, categoria, descricao, status)
agent_conversations(id, agent_name, phone_number, messages JSONB, context JSONB, updated_at)
agent_metrics(id, agent_name, tokens_in, tokens_out, cost_usd, latency_ms, created_at)
```

#### Compras e financeiro
```sql
purchase_orders(id, unit_id, supplier_id, numero, status, valor_total, data_pedido)
purchase_order_items(id, order_id, ingredient_id, quantidade, preco_unitario, total GENERATED)
suppliers(id, unit_id, nome, cnpj, contato, categoria)
ingredients(id, group_id, codigo, nome, categoria, unidade_padrao, custo_medio)
ingredient_price_history(id, ingredient_id, supplier_id, preco, data)
price_quotes(id, unit_id, supplier_id, periodo, status)
price_quote_items(id, quote_id, ingredient_id, quantidade, preco_unitario)
stock_movements(id, unit_id, ingredient_id, tipo, quantidade, motivo)
lancamentos(id, brand_id, unit_id, natureza, regime, categoria, valor, competencia, aprovado)
financial_periods(id, brand_id, competencia, receita_total, despesa_total, cmv_total)
```

#### Operação e comercial
```sql
quality_checklists(id, unit_id, nome, area, turno, items JSONB, ativo)
checklist_records(id, checklist_id, employee_id, turno, data, respostas JSONB, score)
restaurant_tables(id, unit_id, numero, capacidade, area, status, ativo)
reservations(id, unit_id, data, hora, pax, status, origem, cliente_nome, cliente_telefone)
clients(id, brand_id, unit_id, nome, email, telefone, empresa, origem, segmento)
events(id, unit_id, nome, data, hora_inicio, hora_fim, pax, status, valor_total, ...)
event_staff(id, event_id, employee_id, funcao, confirmado)
event_menu_items(id, event_id, nome, quantidade, preco_unitario)
```

---

## 8. ORQUESTRADOR HOS

### Jobs ativos em produção

| slug | nome | auto_approve | trigger |
|------|------|-------------|---------|
| qa_preview | QA Playwright | TRUE | GitHub Actions deployment |
| code_review | Code Review PR | FALSE | GitHub webhook pull_request |
| deploy_prod | Deploy Production | FALSE | Vercel webhook deployment.succeeded |
| compliance_documental | Compliance Documental | FALSE | cron 0 8 * * * |
| ferias_monitor | Férias Monitor | FALSE | cron 0 8 * * 1 (segunda) |
| folha_validator | Folha Validator | FALSE | cron 0 8 25 * * (dia 25) |
| onboarding_checker | Onboarding Checker | FALSE | cron 0 9 * * * |

### Crons Vercel (vercel.json)
```json
[
  { "path": "/api/orchestrator/escalate",         "schedule": "*/30 * * * *" },
  { "path": "/api/orchestrator/cron/compliance",  "schedule": "0 8 * * *" },
  { "path": "/api/orchestrator/cron/ferias",      "schedule": "0 8 * * 1" },
  { "path": "/api/orchestrator/cron/folha",       "schedule": "0 8 25 * *" },
  { "path": "/api/orchestrator/cron/onboarding",  "schedule": "0 9 * * *" }
]
```

### Escalação de runs
O endpoint `/api/orchestrator/escalate` (cron 30min) notifica no Discord quando um run fica sem aprovação por 2h, 4h ou 8h. Tiers progressivos.

### Discord
- **App ID:** 1498287829464256563 · **Bot:** ClaudeBridge
- **Comandos slash:** `/aprovar run_id:UUID` · `/rejeitar run_id:UUID` · `/hos`
- **Canal:** #orquestrador (webhook em `DISCORD_WEBHOOK_URL`)

### Integração onboarding → orquestrador
Quando um `onboarding_run` é criado, a função `resolverOnboardingPendente` marca como `approved` qualquer `hos_run` pendente do job `onboarding_checker` para aquele employee:

```typescript
await supabase.from("hos_runs")
  .update({ status: "approved", result_data: { ... } })
  .eq("job_id", job.id)
  .in("status", ["pending", "awaiting_approval"])
  .filter("payload->>'employee_id'", "eq", employeeId);
```

---

## 9. MÓDULOS — RESUMO POR ROTA

### Módulo Pessoas (src/app/(dashboard)/pessoas/)

| Rota | Módulo | Tabelas |
|------|--------|---------|
| /pessoas/colaboradores | CRUD colaboradores | employees |
| /pessoas/headcount | Análise de headcount | employees |
| /pessoas/escala | Grade de turnos | shifts |
| /pessoas/ponto | Registro de ponto | time_clock_punches |
| /pessoas/ferias | Férias | vacations |
| /pessoas/faltas | Faltas | absences |
| /pessoas/horas-extras | Horas extras | overtime_records |
| /pessoas/disciplina | Advertências + score | warnings |
| /pessoas/holerites | Holerites PDF | payslips |
| /pessoas/gorjetas | Sistema de pontos gorjeta | gorjeta_* |
| /pessoas/vale-transporte | Vale transporte | transport_vouchers |
| /pessoas/treinamentos | Templates + registros | training_templates, training_records |
| /pessoas/avaliacoes | Avaliações de desempenho | performance_templates, performance_reviews |
| /pessoas/avaliacoes/ciclos | Ciclos 360° | avaliacao_ciclos, avaliacao_participantes |
| /pessoas/avaliacoes/9box | Matriz 9Box | performance_reviews |
| /pessoas/pdi | PDI + metas | pdis, pdi_metas |
| /pessoas/reunioes | Reuniões 1:1 | reunioes_1on1, reuniao_action_items |
| /pessoas/organograma | Árvore hierárquica CSS-only | employees (manager_id) |
| /pessoas/onboarding | Runs de onboarding | onboarding_runs, onboarding_checklist |
| /pessoas/onboarding/templates | Templates reutilizáveis | onboarding_templates, onboarding_tarefas |
| /pessoas/feedback | Feedback contínuo | feedbacks |
| /pessoas/documentos | Docs trabalhistas | employee_documents (Storage) |
| /pessoas/importacao | Import CSV Totvs | ponto_mensal |
| /pessoas/relatorio-ponto | Relatório de ponto | ponto_mensal |

---

## 10. VARIÁVEIS DE AMBIENTE

### Obrigatórias (`.env.local` em dev, Vercel em prod)

| Variável | Onde usar | Descrição |
|----------|-----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Chave anon (RLS aplica) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Only | Bypassa RLS — NUNCA no client bundle |
| `ANTHROPIC_API_KEY` | Server Only | Claude API para agentes e insights |
| `DISCORD_PUBLIC_KEY` | Server Only | Verificação Ed25519 de slash commands |
| `DISCORD_BOT_TOKEN` | Server Only | Token do bot ClaudeBridge |
| `DISCORD_APP_ID` | Server Only | 1498287829464256563 |
| `DISCORD_WEBHOOK_URL` | Server Only | Webhook do canal #orquestrador |
| `GITHUB_TOKEN` | Server Only | PAT para code review (lê diff, posta comment) |
| `GITHUB_WEBHOOK_SECRET` | Server Only | Verificação HMAC de webhooks do GitHub |
| `CRON_SECRET` | Server Only | Header `Authorization: Bearer $CRON_SECRET` nos crons Vercel |
| `QA_CALLBACK_SECRET` | Server Only | Autenticação do callback QA Playwright |
| `NEXT_PUBLIC_APP_URL` | Client + Server | URL base (https://kph-os.vercel.app em prod) |

---

## 11. WORKFLOW DE DESENVOLVIMENTO

### Passo a passo para implementar uma feature

1. **Criar branch:** `feat/nome-do-modulo` ou `fix/nome-do-bug`
2. **Migration SQL primeiro** se há mudanças no banco:
   - Criar `supabase/migrations/0XX_descricao.sql`
   - Aplicar **manualmente** no Supabase SQL Editor antes de mergear
   - Numbering sequencial — verificar última migration para saber o número
3. **Server Actions** em `src/app/(dashboard)/modulo/actions.ts`:
   - `"use server"` no topo
   - Importar `createServiceClient` para mutações
   - Usar padrão `ActionResult<T>`
   - Chamar `requireUser()` no início
4. **Pages** (Server Components):
   - `export const dynamic = "force-dynamic"`
   - `await params` para rotas dinâmicas
   - Suspense para queries lentas
5. **Client Components** (`-client.tsx`):
   - `"use client"` no topo
   - `mounted` guard se há dados SSR-sensíveis
   - `useTransition` + `useRouter` para ações assíncronas
6. **TypeScript check:** `npx tsc --noEmit` — DEVE passar limpo
7. **Commit e PR:**
   ```
   git add arquivo1 arquivo2 arquivo3
   git commit -m "feat(modulo): descrição do que foi feito"
   git push origin feat/nome-do-modulo
   gh pr create --base main
   ```

### Convenções de branch e commit

- **Branches:** `feat/nome`, `fix/nome`, `chore/nome`, `debug/nome`
- **Commits:** `feat(scope): descrição` — em português ou inglês
- **Scope:** nome do módulo (`pdi`, `reunioes`, `onboarding`, `orquestrador`, etc.)

### Fluxo de PR

1. PR aberto → Orquestrador detecta → Code Review automático (Claude analisa diff)
2. QA Playwright roda smoke tests no preview URL
3. Se tudo ok → merge manual no GitHub
4. Merge em `main` → Vercel deploya em produção automaticamente

---

## 12. ERROS COMUNS E SOLUÇÕES

### RLS bloqueando inserts/updates
**Sintoma:** Server Action retorna erro do Supabase ou dados vazios sem motivo.
**Causa:** Usando `createSupabaseServerClient()` onde deveria ser `createServiceClient()`.
**Fix:** Mudar para `createServiceClient()` em Server Actions.

### params não awaited
**Sintoma:** `TypeError: Cannot destructure property 'id' of params`
**Causa:** Next.js 16 — `params` é `Promise<{...}>`, não o objeto diretamente.
**Fix:** `const { id } = await params;`

### Hydration mismatch
**Sintoma:** Erro no console: "Text content did not match. Server: '...' Client: '...'"
**Causa:** Componente client renderiza coisas diferentes no servidor e no cliente.
**Fix:** Adicionar `mounted` guard — só renderiza conteúdo dinâmico após `useEffect`.

### TypeScript: array index `possibly undefined`
**Sintoma:** `TS2322: Type 'T | undefined' is not assignable to type 'T'`
**Causa:** `noUncheckedIndexedAccess: true` — `array[i]` pode ser `undefined`.
**Fix:** Use `array[i]!` quando certeza que existe, ou `array[i] ?? defaultValue`.

### TypeScript: circular inference em async loop
**Sintoma:** `TS7022: 'X' implicitly has type 'any' because it references itself`
**Causa:** Supabase query async dentro de while loop — TypeScript não resolve o tipo.
**Fix:** Pré-carregar todos os dados antes do loop, usar um `Map` e iterar sem await.

### Supabase insert type error
**Sintoma:** `TS2345: Argument of type '...' is not assignable to parameter`
**Causa:** Tipos gerados pelo SDK não casam exatamente com o objeto de insert.
**Fix:** Cast `as never` no objeto ou use `(supabase as any).from(...)` para tabelas não tipadas.

### Lucide icon `title` prop
**Sintoma:** `TS2322: Property 'title' does not exist`
**Causa:** Ícones Lucide não aceitam prop `title` diretamente.
**Fix:** Remover prop `title` do ícone; use um elemento `<span title="...">` wrapper se necessário.

### hos_approvals FK quebra
**Sintoma:** `invalid input syntax for type uuid: "bypass"` — FK para auth.users falha.
**Causa:** Código antigo usava string `"bypass"` como user_id.
**Fix:** Usar sempre o UUID `00000000-0000-0000-0000-000000000001`.

### Vercel webhook duplicado
**Sintoma:** Mesmo deployment cria dois `hos_runs`.
**Causa:** Vercel dispara `deployment.created` e `deployment.succeeded` — ambos chegam.
**Fix:** Campo `deployment_id` + UNIQUE INDEX em `(deployment_id, job_id)` — migration 046.

### Tailwind v4 não tem `tailwind.config.ts`
**Sintoma:** Estilos não aplicam, build quebra.
**Causa:** Tailwind v4 usa `@import "tailwindcss"` no CSS, sem arquivo de config.
**Fix:** Não criar `tailwind.config.ts`. Customizações vão em `globals.css` com CSS vars.

---

## 13. SISTEMAS SATÉLITES

Estes projetos NÃO estão neste repo, mas integram com o mesmo Supabase:

| Sistema | Repo | URL Prod | Stack | Dir local |
|---------|------|----------|-------|-----------|
| HOS App (mobile) | N/A | App Store/TestFlight | React Native + Expo SDK 54 | ~/Desktop/_ORKESTRI/_HOS_APP/ |
| Maya (R&S WhatsApp) | maya-kph | maya-kph-production.up.railway.app | FastAPI + Railway | ~/Desktop/_ORKESTRI/_MAYA/ |
| Theo (SAC WhatsApp) | theo-kph | theo-kph-production.up.railway.app | FastAPI + Railway | ~/Desktop/_ORKESTRI/_THEO/ |
| Serena (atendimento) | serena-kph | restaurant-ai-production-bb5d.up.railway.app | FastAPI + Railway | ~/Desktop/_ORKESTRI/_Serena/ |

**Atenção:** Serena usa **Supabase próprio** (não o iqgrvptrtphvbmvrqntm). Maya e Theo usam o Supabase do KPH OS para `candidatos_maya` e `theo_tickets`.

### Deploy dos satélites (Railway)
```bash
# Não usar git push — Railway detecta via CLI
railway up
```

### HOS App — Mobile
- Expo SDK 54, 13 telas
- Auth próprio via `employee_auth` (CPF + senha, não auth.users)
- Endpoint ponto: `POST /api/ponto/punch` (route handler no KPH OS)
- View `tips_records` para gorjetas (migration 044)
- Seed de `employee_auth` é feito manualmente via Supabase SQL Editor

---

## 14. COMPONENTES REUTILIZÁVEIS

### Shell
- `Sidebar` — navegação principal com grupos colapsáveis, persistência em localStorage
- `TopBar` — barra superior com breadcrumb e notificações
- `NotificationBell` — sino de notificações com polling

### UI (shadcn/ui em src/components/ui/)
`Button`, `Input`, `Label`, `Textarea`, `Select`, `Dialog`, `Badge`, `Card`, `Table`, `Tabs`, `Tooltip`, `Avatar`, `Sonner` (toasts), `Sheet` (drawer mobile), `Command` (cmdk — busca)

### Padrão de CSS
O projeto usa **CSS variables** em vez de classes Tailwind para estilização dos componentes principais:

```css
var(--surface)      /* background de cards */
var(--surface-2)    /* background secundário */
var(--border)       /* bordas */
var(--text)         /* texto principal */
var(--text-2)       /* texto secundário */
var(--text-3)       /* texto terciário/placeholder */
var(--brand)        /* cor primária da brand */
var(--brand-soft)   /* versão suave da cor primária */
var(--destructive)  /* vermelho de erro */
var(--t)            /* transição padrão */
```

Estilos inline com `style={{ ... }}` são comuns nos componentes — é o padrão do projeto, não deve ser refatorado para classes Tailwind sem motivo.

---

## 15. LIBS INTERNAS IMPORTANTES

### `src/lib/result.ts`
```typescript
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
```

### `src/lib/format.ts`
Formatadores de datas e moedas no padrão pt-BR.

### `src/lib/pessoas/clt.ts`
Cálculos CLT: INSS progressivo, IRRF, FGTS, horas extras (50%/100%), adicional noturno, DSR sobre gorjeta.

### `src/lib/pessoas/score.ts`
Score disciplinar: calcula nota 0-100 baseado em advertências, faltas, HE aprovadas.

### `src/lib/export.ts`
Exportação para Excel via `xlsx`.

### `src/lib/orquestrador/actions.ts`
Funções do orquestrador:
- `createRun(jobSlug, payload, title?)` — cria novo run
- `autoApproveRun(runId)` — aprova automaticamente
- `submitRunDecision(runId, decision, rationale)` — aprovação/rejeição humana
- `updateRunLogs(runId, logs)` — atualiza logs de execução
- `markRunFailed(runId, reason)` — marca como falho
- `generateWeeklyInsight()` — gera relatório semanal via Claude API
- `listInsights()` — lista insights

---

## 16. OBSERVAÇÕES FINAIS

1. **Migrations rodam manualmente.** Nunca confie que uma migration foi aplicada automaticamente — sempre verificar no Supabase Dashboard antes de mergear um PR que depende dela.

2. **O `.claude/CLAUDE.md` deve ser atualizado** sempre que houver mudanças arquiteturais importantes: nova tabela, novo padrão de código, novo módulo com padrão diferente.

3. **PRs mergeados até 12/05/2026:** #1 ao #31 (PDI, Reuniões, Organograma, Onboarding). Sistema estável em produção.

4. **Sprint 6 — backlog pendente:**
   - Login persistente (auth ativo para usuários reais)
   - Seed de `employee_auth` para HOS App
   - Discord Commander conversacional
   - DB Guardian (agente de monitoramento de banco)

5. **Quando a tabela não está em `src/types/database.ts`:** use `(supabase as any).from("tabela")`. Isso acontece com tabelas criadas por migrations recentes antes de rodar `supabase gen types typescript`.
