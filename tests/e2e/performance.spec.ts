import { test, expect } from "@playwright/test"

const ADMIN = { email: "teste@teste.com", password: "teste1234" }

// Limiares generosos de propósito: isso roda contra `next dev` (compilação
// sob demanda, sem otimizações de produção), não `next start`. O objetivo
// aqui é pegar regressão grosseira (uma página que passou a levar 10x mais
// tempo), não validar um SLA de produção.
const MAX_LOAD_MS = 5_000

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login")
  await page.locator("#email").fill(ADMIN.email)
  await page.locator("#password").fill(ADMIN.password)
  await page.getByRole("button", { name: "Entrar no Painel" }).click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
}

test.describe("Performance de carregamento", () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  for (const [path, readyLocator] of [
    ["/dashboard", "Vendas do Dia"],
    ["/products", "Produtos"],
    ["/sales", "Vendas"],
    ["/reports", "Relatórios"],
  ] as const) {
    test(`${path} carrega em menos de ${MAX_LOAD_MS}ms (já autenticado)`, async ({ page }) => {
      const start = Date.now()
      await page.goto(path)
      await expect(page.getByText(readyLocator).first()).toBeVisible({ timeout: MAX_LOAD_MS })
      const elapsed = Date.now() - start
      expect(elapsed).toBeLessThan(MAX_LOAD_MS)
    })
  }

  test("dashboard: métricas de navegação do browser ficam dentro do esperado", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.getByText("Vendas do Dia")).toBeVisible()

    const timing = await page.evaluate(() => {
      const [nav] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[]
      return { domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime, loadEvent: nav.loadEventEnd - nav.startTime }
    })

    expect(timing.domContentLoaded).toBeLessThan(MAX_LOAD_MS)
  })
})
