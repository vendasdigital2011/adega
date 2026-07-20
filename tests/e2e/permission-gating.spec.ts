import { test, expect } from "@playwright/test"

const ADMIN = { email: "teste@teste.com", password: "teste1234" }
const VENDEDOR = { email: "vendedor@teste.com", password: "vendedor1234" }

async function login(page: import("@playwright/test").Page, user: { email: string; password: string }) {
  await page.goto("/login")
  await page.locator("#email").fill(user.email)
  await page.locator("#password").fill(user.password)
  await page.getByRole("button", { name: "Entrar no Painel" }).click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
}

test.describe("Página bloqueada por permissão", () => {
  test("vendedor sem audit.view: sem link no menu e página mostra aviso de permissão", async ({ page }) => {
    await login(page, VENDEDOR)

    await expect(page.getByRole("link", { name: "Auditoria" })).toHaveCount(0)

    await page.goto("/audit")
    await expect(page.getByText(/não tem permissão/i)).toBeVisible({ timeout: 10_000 })
  })

  test("admin com audit.view: link no menu e página carrega os logs", async ({ page }) => {
    await login(page, ADMIN)

    await expect(page.getByRole("link", { name: "Auditoria" })).toBeVisible()

    await page.goto("/audit")
    await expect(page.getByText(/não tem permissão/i)).toHaveCount(0)
    await expect(page.getByRole("heading", { name: "Auditoria" })).toBeVisible()
  })
})
