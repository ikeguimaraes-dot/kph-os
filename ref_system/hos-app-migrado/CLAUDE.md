# HOS App (migrado para KPH OS) — Documentação

> Versão **migrada** para o backend KPH OS (Supabase project `iqgrvptrtphvbmvrqntm`).
> O app de funcionarios + entrevista de candidatos agora aponta para o schema novo.
> Para detalhes da migracao em si, ler **MIGRACAO.md** ao lado.

---

## 1. O que mudou

- Supabase URL: agora `https://iqgrvptrtphvbmvrqntm.supabase.co` (era `afxsrcezmetipzgosdvb`).
- Schema de `employees`: `full_name` → `nome + sobrenome`, `cargo` → `funcao`.
- Schema de `payslips`: `periodo` (TEXT YYYY-MM) → `competencia` (DATE), `valor_liquido` → `liquido`, `pdf_path` → `pdf_url`. Removidos: `total_vencimentos`, `total_descontos`, `inss_base`, `irrf_base` — `Total Vencimentos` e `Total Descontos` agora sao calculados client-side.
- Schema de `absences`: `date/type/reason` → `data/tipo/motivo`.
- Schema de `warnings`: `date/level/description` → `data/nivel/descricao` (e `nivel` agora aceita `verbal | escrita | suspensao`).
- Schema de `documents`: type CHECK IN ('RG','CPF','CTPS','contrato','exame','outro') + `unit_id` NOT NULL.
- Schema de `campaigns`: multi-tenant — filtra por `brand_id` (resolvido via employees → units), nao mais `target=company`.
- Schema de `interview_questions`: `ordem` → `order_num`, `video_path` → `video_url`.
- Schema de `candidates`: `status` agora eh decisao do RH (`pendente|aprovado|reprovado`); ciclo da entrevista vai em `interview_status` (`pendente|em_andamento|concluido`).
- Schema de `employee_auth`: `employee_id` agora eh NOT NULL — `primeiroAcesso` busca o employee pelo CPF antes de inserir.

---

## 2. Stack (igual ao original)

- React Native 0.81.5 + Expo ~54
- TypeScript ~5.9.2 strict
- @supabase/supabase-js ^2.102.1 com service_role
- React Navigation Stack + Bottom Tabs
- expo-camera (CameraView), expo-av (Video)
- AsyncStorage pra sessao local

---

## 3. Estrutura de arquivos

```
hos-app-migrado/
├── App.tsx                          <- Navegação (NÃO mudou)
├── src/lib/
│   ├── supabase.ts                  <- ⚙️ KPH OS URL + service key (.env.local)
│   ├── types.ts                     <- ⚙️ Employee com nome+sobrenome+funcao+score+status_rh; getDisplayName helper
│   └── auth.ts                      <- ⚙️ login com JOIN brands; primeiroAcesso com employee_id
└── src/screens/
    ├── LoginScreen.tsx              (UI inalterada)
    ├── PrimeiroAcessoScreen.tsx     (UI inalterada)
    ├── HomeScreen.tsx               <- ⚙️ podio nome/sobrenome; payslips.competencia/liquido; absences.data
    ├── FinanceiroScreen.tsx         <- ⚙️ payslips.competencia/liquido/pdf_url; vencimentos/descontos calculados; tips com pontos × valor
    ├── DocumentosScreen.tsx         <- ⚙️ enum type 6 valores; unit_id obrigatorio; modal de tipo apos pickar arquivo
    ├── RegistroScreen.tsx           <- ⚙️ absences.data/tipo/motivo; warnings.data/nivel/descricao + paleta verbal/escrita/suspensao; tips com Number(valor_ponto)
    ├── FeriasScreen.tsx             <- ⚙️ time_records (filter ferias_dias>0) + vacations (modulo Ferias do painel KPH OS)
    ├── CampanhasScreen.tsx          <- ⚙️ filtro por brand_id (employees→units); janela de datas; getPublicUrl bucket campaign-images
    ├── PdfViewerScreen.tsx          (não usada — null)
    ├── CandidateLoginScreen.tsx     <- ⚙️ checa interview_status === 'concluido'
    ├── InterviewScreen.tsx          <- ⚙️ update interview_status='em_andamento'; .order('order_num'); video_url
    └── InterviewCompleteScreen.tsx  <- ⚙️ update interview_status='concluido'
```

---

## 4. Configuração do Supabase

```
URL:  https://iqgrvptrtphvbmvrqntm.supabase.co
Role: service_role (chave hardcoded em src/lib/supabase.ts)
```

⚠ Service role exposta intencionalmente — o app autentica via `employee_auth` (CPF + senha) e nao usa Supabase Auth. APK/IPA assinado, nao bundle web.

---

## 5. Modelo de auth

`@hos_session` no AsyncStorage com TTL de 7 dias. Ver `src/lib/auth.ts`.

`login(cpf, password)`:
1. SELECT em `employee_auth` por `cpf`. Checa `is_active` e `password_hash === password` (plaintext — divida tecnica).
2. SELECT em `employees` com JOIN `units → brands` pra resolver `empresa = brand.name`.
3. UPDATE `employee_auth.last_login`.
4. AsyncStorage.

`primeiroAcesso(cpf, password)`:
1. SELECT employees por `cpf` — pega `id`.
2. Verifica que nao existe `employee_auth` pra esse CPF.
3. INSERT `employee_auth { cpf, password_hash, employee_id, is_active: true }`. ⚠ employee_id agora obrigatorio (FK NOT NULL no KPH OS).

---

## 6. Storage Buckets KPH OS

| Bucket | Uso | Acesso |
|---|---|---|
| `avatars` | Foto de perfil dos funcionarios | Public read + auth upload/update |
| `documents` | Documentos do colaborador | Auth all (sessao do app via service_role) |
| `campaign-images` | Imagens das campanhas | Public read + auth upload |
| `interview-videos` | Videos das perguntas E respostas dos candidatos | Auth all |

Paths por convencao:
- `avatars/{employee_id}.jpg`
- `documents/{employee_id}/{timestamp}_{filename}`
- `interview-videos/candidates/{candidate_id}/{question_id}.mp4`
- `interview-videos/questions/{vagaId}/{questionId}-{timestamp}.mp4` (RH grava no painel)
- `campaign-images/campaigns/{timestamp}-{rand}.{ext}`

---

## 7. Como rodar

```bash
npm install
npm start          # Expo Go via QR code
npm run ios        # Simulador iOS
npm run android    # Emulador Android
```

⚠ Antes da primeira execucao no novo backend, **rodar seed manual de `employee_auth`** (ver MIGRACAO.md secao "Pre-requisitos"). Sem isso, ninguem consegue fazer login.

---

## 8. Padroes mantidos do original

- `navigation.reset()` em transicoes de auth
- Props tipadas como `any`
- `PGRST116` = row not found em `.single()` (normal pra primeiros usuarios)
- Upload imagens pequenas: base64 → Uint8Array
- Upload videos grandes: `fetch(uri).blob()`
- StyleSheet nativo (NativeWind nao usado em src/)

---

## 9. Dividas tecnicas (mantidas — tratar fora do escopo da migracao)

1. Senhas em plaintext — `employee_auth.password_hash` sem bcrypt.
2. Service role key hardcoded em `supabase.ts` (app distribuido como APK/IPA assinado).
3. `console.log` de debug em varias telas — limpar antes de publicar.
4. `expo-file-system/legacy` em DocumentosScreen e HomeScreen.
5. Sem tipagem nas params de navegacao (todos `any`).
