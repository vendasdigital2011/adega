import { test, expect } from "@playwright/test"

const ADMIN = { email: "teste@teste.com", password: "teste1234" }

test.describe("Login", () => {
  test("redireciona para o login quando não autenticado", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/login/)
  })

  test("credenciais inválidas mostram erro e mantêm na tela de login", async ({ page }) => {
    await page.goto("/login")
    await page.locator("#email").fill(ADMIN.email)
    await page.locator("#password").fill("senha-errada-123")
    await page.getByRole("button", { name: "Entrar no Painel" }).click()

    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText(/inválid|incorret|Invalid/i)).toBeVisible({ timeout: 10_000 })
  })

  test("login válido leva ao dashboard com o nome do usuário", async ({ page }) => {
    await page.goto("/login")
    await page.locator("#email").fill(ADMIN.email)
    await page.locator("#password").fill(ADMIN.password)
    await page.getByRole("button", { name: "Entrar no Painel" }).click()

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
    await expect(page.getByText("Administrador Teste").first()).toBeVisible()
  })
})
