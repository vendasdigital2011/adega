import { test, expect } from "@playwright/test"

const ADMIN = { email: "teste@teste.com", password: "teste1234" }

test.describe("Fluxo de venda (PDV)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login")
    await page.locator("#email").fill(ADMIN.email)
    await page.locator("#password").fill(ADMIN.password)
    await page.getByRole("button", { name: "Entrar no Painel" }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
  })

  test("registra uma venda fiado de ponta a ponta pela UI", async ({ page }) => {
    // Fiado não exige caixa aberto, então o teste não interfere com o estado
    // de caixa compartilhado com outras suítes (integração/manual).
    await page.goto("/sales")
    await page.getByRole("button", { name: "Nova Venda" }).click()

    const modal = page.getByRole("dialog")
    await expect(modal).toBeVisible()

    // Escolhe um cliente real (venda fiado exige cliente) e forma de pagamento Fiado.
    const customerSelect = modal.locator('select[name="customer_id"]')
    const customerName = await customerSelect.locator("option").nth(1).textContent()
    await customerSelect.selectOption({ index: 1 })
    await modal.locator('select[name="payment_method"]').selectOption("Fiado")

    // Item: primeiro produto disponível no select, quantidade 1. O preço
    // unitário não é preenchido automaticamente a partir do produto — é um
    // campo obrigatório separado no formulário.
    await modal.locator('select[name="items.0.product_id"]').selectOption({ index: 1 })
    await modal.locator('input[name="items.0.quantity"]').fill("1")
    await modal.locator('input[name="items.0.unit_price"]').fill("10")

    await modal.getByRole("button", { name: "Finalizar Venda" }).click()

    // O toast de sucesso do react-hot-toast some rápido (~2s) — a prova
    // confiável é o modal fechar e a venda aparecer no topo da listagem
    // (ordenada por created_at desc), não o texto do toast.
    await expect(modal).not.toBeVisible({ timeout: 15_000 })
    const firstRow = page.locator("table tbody tr").first()
    await expect(firstRow).toContainText(customerName!.trim())
    await expect(firstRow).toContainText("Fiado")
  })
})
