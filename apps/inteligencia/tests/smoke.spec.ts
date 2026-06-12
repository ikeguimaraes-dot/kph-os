/**
 * Smoke tests — KPH-OS Inteligência
 * Routes: /inteligencia/adocao, /inteligencia/feedback, /inteligencia/roadmap, /orquestrador
 *
 * Acceptance criteria source: task brief + source-code inspection.
 * Auth: bypass user (bypass@kph.os, founder role) is injected server-side when
 *       no real session exists, so all pages load without login.
 */

import { test, expect, type Page } from "@playwright/test";

const BASE = "http://localhost:3007";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function goto(page: Page, path: string) {
  const res = await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  return res;
}

// ─────────────────────────────────────────────────────────────────────────────
// /inteligencia/adocao
// ─────────────────────────────────────────────────────────────────────────────

test.describe("/inteligencia/adocao", () => {
  test("page loads and h1 is visible", async ({ page }) => {
    await goto(page, "/inteligencia/adocao");
    await expect(page).toHaveURL(`${BASE}/inteligencia/adocao`);
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("Adoção da plataforma");
  });

  test("page_views table exists — MigrationBanner with SQL is NOT shown", async ({ page }) => {
    await goto(page, "/inteligencia/adocao");

    // MigrationBanner renders "Migration pendente" heading and SQL DDL for page_views.
    // If visible → table is missing in DB → acceptance criterion NOT MET.
    // We assert it is not visible; if it IS visible the test fails and records why.
    const migrationHeading = page.getByText("Migration pendente", { exact: true });
    const sqlCode = page.locator("pre").filter({
      hasText: "CREATE TABLE IF NOT EXISTS public.page_views",
    });

    const migrationVisible = await migrationHeading.isVisible().catch(() => false);
    if (migrationVisible) {
      // Record diagnostic annotation so CI report is clear
      test.info().annotations.push({
        type: "acceptance-criteria-not-met",
        description:
          "page_views table does not exist in Supabase. MigrationBanner is displayed. " +
          "Run migration SQL shown on screen, then re-run tests.",
      });
    }

    await expect(migrationHeading).not.toBeVisible();
    await expect(sqlCode).not.toBeVisible();
  });

  test("Top 5 módulos section renders (or graceful empty state)", async ({ page }) => {
    await goto(page, "/inteligencia/adocao");

    // Skip with informative annotation when DB migration is pending
    const migrationBanner = page.getByText("Migration pendente", { exact: true });
    if (await migrationBanner.isVisible().catch(() => false)) {
      test.info().annotations.push({
        type: "blocked-by",
        description:
          "page_views table missing — Top 5 módulos card not rendered. Run DB migration first.",
      });
      // Verify at minimum that the page itself loaded and has a heading
      await expect(page.locator("h1")).toContainText("Adoção da plataforma");
      return;
    }

    // The TopPathsCard always renders this heading text regardless of data
    const topModulosHeading = page.getByText("Top 5 módulos (últimos 30d)");
    await expect(topModulosHeading).toBeVisible();

    // Either real rows OR the empty-state paragraph must be present
    const emptyMsg = page.getByText("Nenhuma visita registrada ainda.");
    const firstRankSpan = page.locator("span").filter({ hasText: /^1\.$/ });

    const hasData = (await firstRankSpan.count()) > 0;
    const isEmpty = await emptyMsg.isVisible().catch(() => false);

    expect(hasData || isEmpty).toBe(true);
  });

  test("WAU chart section is visible", async ({ page }) => {
    await goto(page, "/inteligencia/adocao");

    // Skip with informative annotation when DB migration is pending
    const migrationBanner = page.getByText("Migration pendente", { exact: true });
    if (await migrationBanner.isVisible().catch(() => false)) {
      test.info().annotations.push({
        type: "blocked-by",
        description:
          "page_views table missing — WAU chart not rendered. Run DB migration first.",
      });
      await expect(page.locator("h1")).toContainText("Adoção da plataforma");
      return;
    }

    // WauCard always renders its title
    const wauHeading = page.getByText("Usuários ativos semanais (WAU)");
    await expect(wauHeading).toBeVisible();

    // The chart renders 4 columns labelled "Sem N"
    const semLabels = page.locator("span").filter({ hasText: /^Sem \d+$/ });
    await expect(semLabels.first()).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// /inteligencia/feedback
// ─────────────────────────────────────────────────────────────────────────────

test.describe("/inteligencia/feedback", () => {
  test("page loads and h1 is visible", async ({ page }) => {
    await goto(page, "/inteligencia/feedback");
    await expect(page).toHaveURL(`${BASE}/inteligencia/feedback`);
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("Bugs & Feedback");
  });

  test("form renders — módulo select is present", async ({ page }) => {
    await goto(page, "/inteligencia/feedback");
    // Module dropdown always present; first option is "Dashboard"
    const moduleSelect = page.locator("select");
    await expect(moduleSelect).toBeVisible();
    await expect(moduleSelect.locator("option").first()).toContainText("Dashboard");
  });

  test("form renders — tipo buttons (Bug, Sugestão, Outro)", async ({ page }) => {
    await goto(page, "/inteligencia/feedback");
    await expect(page.getByRole("button", { name: "Bug" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sugestão" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Outro" })).toBeVisible();
  });

  test("form renders — prioridade buttons (Baixa, Média, Alta)", async ({ page }) => {
    await goto(page, "/inteligencia/feedback");
    await expect(page.getByRole("button", { name: "Baixa" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Média" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Alta" })).toBeVisible();
  });

  test("form renders — descrição textarea is present", async ({ page }) => {
    await goto(page, "/inteligencia/feedback");
    const textarea = page.locator("textarea");
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveAttribute(
      "placeholder",
      "Descreva o bug ou sugestão (mínimo 20 caracteres)…"
    );
  });

  test("form renders — submit button is present", async ({ page }) => {
    await goto(page, "/inteligencia/feedback");
    const submitBtn = page.getByRole("button", { name: "Enviar feedback" });
    await expect(submitBtn).toBeVisible();
  });

  test("table renders (or graceful empty state / migration banner)", async ({ page }) => {
    await goto(page, "/inteligencia/feedback");

    // Three valid render states:
    // 1. Real rows exist  → "Histórico de feedback (N)" heading visible
    // 2. Table empty      → "Nenhum feedback registrado ainda."
    // 3. DB missing       → MigrationBanner with "Migration pendente"
    const historyHeading = page.getByText(/^Histórico de feedback/);
    const emptyMsg = page.getByText("Nenhum feedback registrado ainda.");
    const migrationBanner = page.getByText("Migration pendente", { exact: true });

    const anyVisible =
      (await historyHeading.isVisible().catch(() => false)) ||
      (await emptyMsg.isVisible().catch(() => false)) ||
      (await migrationBanner.isVisible().catch(() => false));

    expect(anyVisible).toBe(true);
  });

  test("status badge is a clickable button for founder (bypass = founder)", async ({ page }) => {
    await goto(page, "/inteligencia/feedback");

    // Only relevant when at least one feedback item exists.
    // If the table has items the isFounder=true path renders <button> for status.
    const historyHeading = page.getByText(/^Histórico de feedback \(\d+\)/);
    const hasItems = await historyHeading.isVisible().catch(() => false);
    if (!hasItems) {
      // No items → skip button assertion, log and pass
      test.info().annotations.push({
        type: "skipped-reason",
        description: "No feedback items in DB — status badge button not rendered",
      });
      return;
    }

    // Status badges rendered as buttons for founder (title="Clique para avançar status")
    const statusButtons = page.locator('button[title="Clique para avançar status"]');
    await expect(statusButtons.first()).toBeVisible();
    await expect(statusButtons.first()).toBeEnabled();
  });

  test("form submission shows no JS error in console", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    await goto(page, "/inteligencia/feedback");

    // Fill out valid form
    await page.locator("textarea").fill(
      "Este é um teste automático de smoke — descricao longa o suficiente."
    );
    await page.getByRole("button", { name: "Enviar feedback" }).click();

    // Wait briefly for any async error to surface
    await page.waitForTimeout(2000);

    const criticalErrors = consoleErrors.filter(
      (e) =>
        !e.includes("ResizeObserver") && // benign browser noise
        !e.includes("Non-Error promise rejection") // benign async noise
    );
    expect(criticalErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// /inteligencia/roadmap
// ─────────────────────────────────────────────────────────────────────────────

test.describe("/inteligencia/roadmap", () => {
  test("page loads and h1 is visible", async ({ page }) => {
    await goto(page, "/inteligencia/roadmap");
    await expect(page).toHaveURL(`${BASE}/inteligencia/roadmap`);
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("Roadmap da plataforma");
  });

  test("3 kanban columns render (Backlog, Em progresso, Entregue)", async ({ page }) => {
    await goto(page, "/inteligencia/roadmap");

    // Only present when DB migration exists (items !== null)
    const migrationBanner = page.getByText("Migration pendente", { exact: true });
    if (await migrationBanner.isVisible().catch(() => false)) {
      // MigrationBanner is a valid render state — columns won't be shown
      test.info().annotations.push({
        type: "skipped-reason",
        description: "roadmap_items table missing — kanban columns not rendered (MigrationBanner shown)",
      });
      return;
    }

    await expect(page.getByText("Backlog", { exact: true })).toBeVisible();
    await expect(page.getByText("Em progresso", { exact: true })).toBeVisible();
    await expect(page.getByText("Entregue", { exact: true })).toBeVisible();
  });

  test("at least 1 card is visible (or empty state per column)", async ({ page }) => {
    await goto(page, "/inteligencia/roadmap");

    const migrationBanner = page.getByText("Migration pendente", { exact: true });
    if (await migrationBanner.isVisible().catch(() => false)) {
      test.info().annotations.push({
        type: "skipped-reason",
        description: "roadmap_items table missing — no cards rendered",
      });
      return;
    }

    // Either real cards (buttons with "▼ ver detalhes") or column empty-state divs
    const detailHints = page.getByText("▼ ver detalhes");
    const emptyCol = page.getByText("Nenhum item");

    const hasCards = (await detailHints.count()) > 0;
    const hasEmptyCol = (await emptyCol.count()) > 0;

    expect(hasCards || hasEmptyCol).toBe(true);
  });

  test("clicking a card expands/collapses it", async ({ page }) => {
    await goto(page, "/inteligencia/roadmap");

    const migrationBanner = page.getByText("Migration pendente", { exact: true });
    if (await migrationBanner.isVisible().catch(() => false)) {
      test.info().annotations.push({
        type: "skipped-reason",
        description: "roadmap_items table missing — no cards to click",
      });
      return;
    }

    const firstCard = page.getByRole("button").filter({ hasText: "▼ ver detalhes" }).first();
    const hasCard = (await firstCard.count()) > 0;
    if (!hasCard) {
      test.info().annotations.push({
        type: "skipped-reason",
        description: "No roadmap cards present in DB",
      });
      return;
    }

    await expect(firstCard).toBeVisible();

    // Expand
    await firstCard.click();
    await expect(page.getByText("▲ recolher").first()).toBeVisible();

    // Collapse
    await firstCard.click();
    await expect(firstCard).toContainText("▼ ver detalhes");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// /orquestrador
// ─────────────────────────────────────────────────────────────────────────────

test.describe("/orquestrador", () => {
  test("page loads and h1 is visible", async ({ page }) => {
    await goto(page, "/orquestrador");
    await expect(page).toHaveURL(`${BASE}/orquestrador`);
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    await expect(h1).toContainText("Orquestrador de jobs");
  });

  test("renders without JS error in console", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    await goto(page, "/orquestrador");

    const criticalErrors = consoleErrors.filter(
      (e) =>
        !e.includes("ResizeObserver") &&
        !e.includes("Non-Error promise rejection")
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("table headers (Tipo, Status, Payload, Data) visible when jobs exist", async ({
    page,
  }) => {
    await goto(page, "/orquestrador");

    // Three valid states:
    // 1. jobs = null  → "Tabela hos_jobs não encontrada"
    // 2. jobs = []    → "Nenhum job registrado ainda."
    // 3. jobs = [...]  → full table with headers

    const noTable = page.getByText("Tabela hos_jobs não encontrada");
    const noJobs = page.getByText("Nenhum job registrado ainda.");
    const tableContainer = page.getByText("Execuções recentes");

    const missingTable = await noTable.isVisible().catch(() => false);
    const emptyJobs = await noJobs.isVisible().catch(() => false);
    const hasJobs = await tableContainer.isVisible().catch(() => false);

    expect(missingTable || emptyJobs || hasJobs).toBe(true);

    if (hasJobs) {
      await expect(page.getByRole("columnheader", { name: "Tipo" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Payload" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Data" })).toBeVisible();
    }
  });

  test("summary pills section renders when jobs exist", async ({ page }) => {
    await goto(page, "/orquestrador");

    const hasJobs = await page.getByText("Execuções recentes").isVisible().catch(() => false);

    if (!hasJobs) {
      test.info().annotations.push({
        type: "skipped-reason",
        description: "No jobs in DB — summary pills section not rendered",
      });
      return;
    }

    // When jobs exist, the component renders summary pills with job type labels.
    // At least one of the 7 known job type labels should be visible.
    const knownLabels = [
      "Deploy produção",
      "Code review",
      "QA preview",
      "Sincronização de dados",
      "Alerta gerado",
      "Feedback recebido",
      "Insight gerado",
    ];

    let atLeastOneVisible = false;
    for (const label of knownLabels) {
      const el = page.getByText(label, { exact: true });
      if (await el.isVisible().catch(() => false)) {
        atLeastOneVisible = true;
        break;
      }
    }
    expect(atLeastOneVisible).toBe(true);
  });

  test("empty state or job list renders without crashing", async ({ page }) => {
    await goto(page, "/orquestrador");

    // The page must render something meaningful in all three DB states
    const meanings = [
      page.getByText("Tabela hos_jobs não encontrada"),
      page.getByText("Nenhum job registrado ainda."),
      page.getByText("Execuções recentes"),
    ];

    let anyRendered = false;
    for (const el of meanings) {
      if (await el.isVisible().catch(() => false)) {
        anyRendered = true;
        break;
      }
    }
    expect(anyRendered).toBe(true);
  });
});
