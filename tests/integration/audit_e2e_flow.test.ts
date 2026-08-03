import { describe, it, expect, beforeEach } from "vitest"
import { categoryService } from "@/services/CategoryService"
import { brandService } from "@/services/BrandService"
import { productService } from "@/services/ProductService"
import { supplierService } from "@/services/SupplierService"
import { purchaseService } from "@/services/PurchaseService"
import { customerService } from "@/services/CustomerService"
import { cashService } from "@/services/CashService"
import { saleService } from "@/services/SaleService"
import { dashboardService } from "@/services/DashboardService"

describe("AUDITORIA-E2E-001 — Fluxo Completo de Compra, Estoque, Venda e Caixa", () => {
  beforeEach(() => {
    // Limpar o store mock em memória para cada execução da suíte de auditoria
    if ((globalThis as any).__ADEGA_MOCK_STORE__) {
      (globalThis as any).__ADEGA_MOCK_STORE__ = {}
    }
  })

  it(
    "Executa o fluxo completo do TESTE 01 ao TESTE 13 com sucesso absoluto",
    async () => {
      // ----------------------------------------------------
      // TESTE 01 — CATEGORIA
      // ----------------------------------------------------
      const cat = await categoryService.create({
        name: "Cervejas",
        description: "Cervejas em geral",
      })
      expect(cat).toBeDefined()
      expect(cat.id).toBeDefined()
      expect(cat.name).toBe("Cervejas")
      expect(cat.company_id).toBeDefined()
      expect(cat.active).toBe(true)

      const catList = await categoryService.list({ page: 1, limit: 50, active: true })
      const foundCat = catList.data.find((c) => c.name === "Cervejas")
      expect(foundCat).toBeDefined()

      // ----------------------------------------------------
      // TESTE 02 — MARCA
      // ----------------------------------------------------
      const brand = await brandService.create({
        name: "Heineken",
      })
      expect(brand).toBeDefined()
      expect(brand.id).toBeDefined()
      expect(brand.name).toBe("Heineken")
      expect(brand.company_id).toBeDefined()
      expect(brand.active).toBe(true)

      const brandList = await brandService.list({ page: 1, limit: 50, active: true })
      const foundBrand = brandList.data.find((b) => b.name === "Heineken")
      expect(foundBrand).toBeDefined()

      // ----------------------------------------------------
      // TESTE 03 — PRODUTO
      // ----------------------------------------------------
      const product = await productService.create({
        name: "Cerveja Heineken 330ml",
        category_id: cat.id,
        brand_id: brand.id,
        sku: "HEI-330",
        barcode: "789000000001",
        purchase_price: 4.0,
        sale_price: 8.0,
        minimum_stock: 5,
        current_stock: 0,
        unit: "UN",
        active: true,
      } as any)

      expect(product).toBeDefined()
      expect(product.id).toBeDefined()
      expect(product.sku).toBe("HEI-330")
      expect(product.category_id).toBe(cat.id)
      expect(product.brand_id).toBe(brand.id)
      expect(Number(product.purchase_price)).toBe(4.0)
      expect(Number(product.sale_price)).toBe(8.0)
      expect(Number(product.current_stock)).toBe(0)
      expect(product.company_id).toBeDefined()

      // ----------------------------------------------------
      // TESTE 04 — FORNECEDOR
      // ----------------------------------------------------
      const supplier = await supplierService.create({
        name: "Distribuidora Teste",
        document: "12345678000199",
        email: "contato@distribuidorateste.com",
        phone: "11999999999",
      })

      expect(supplier).toBeDefined()
      expect(supplier.id).toBeDefined()
      expect(supplier.name).toBe("Distribuidora Teste")
      expect(supplier.company_id).toBeDefined()

      const supplierList = await supplierService.list({ page: 1, limit: 50, active: true })
      const foundSupplier = supplierList.data.find((s) => s.id === supplier.id)
      expect(foundSupplier).toBeDefined()

      // ----------------------------------------------------
      // TESTE 05 — COMPRA & ENTRADA DE ESTOQUE (+50)
      // ----------------------------------------------------
      const purchaseId = await purchaseService.create({
        supplier_id: supplier.id,
        purchase_date: new Date().toISOString(),
        freight: 0,
        discount: 0,
        notes: "Compra de teste auditoria E2E",
        items: [
          {
            product_id: product.id,
            quantity: 50,
            unit_price: 4.0,
          },
        ],
      })

      expect(purchaseId).toBeDefined()
      expect(typeof purchaseId).toBe("string")

      // Confirmar/Receber a compra
      await purchaseService.receive(purchaseId)

      const purchasesList = await purchaseService.list({ page: 1, limit: 50 })
      const receivedPurchase = purchasesList.data.find((p) => p.id === purchaseId)
      expect(receivedPurchase).toBeDefined()
      expect(receivedPurchase?.status.toLowerCase()).toBe("recebida")

      // Verificar se o estoque do produto foi atualizado para 50
      const updatedProdAfterPurchase = await productService.getById(product.id)
      expect(Number(updatedProdAfterPurchase.current_stock)).toBe(50)

      // ----------------------------------------------------
      // TESTE 06 — CLIENTE
      // ----------------------------------------------------
      const customer = await customerService.create({
        name: "Cliente Teste",
        document: "12345678901",
        email: "cliente@teste.com",
      })

      expect(customer).toBeDefined()
      expect(customer.id).toBeDefined()
      expect(customer.name).toBe("Cliente Teste")
      expect(customer.company_id).toBeDefined()

      const customerList = await customerService.list({ page: 1, limit: 50, active: true })
      const foundCustomer = customerList.data.find((c) => c.id === customer.id)
      expect(foundCustomer).toBeDefined()

      // ----------------------------------------------------
      // TESTE 07 — ABERTURA DE CAIXA
      // ----------------------------------------------------
      const cashId = await cashService.open({
        initial_value: 100.0,
        notes: "Abertura teste auditoria E2E",
      })

      expect(cashId).toBeDefined()

      const cashRegister = await cashService.getOpenRegister()
      expect(cashRegister).toBeDefined()
      expect(cashRegister?.id).toBe(cashId)
      expect(cashRegister?.status.toUpperCase()).toBe("ABERTO")
      expect(Number(cashRegister?.initial_value)).toBe(100.0)

      // ----------------------------------------------------
      // TESTE 08 — VENDA (PDV R$ 80,00) & BAIXA DE ESTOQUE (-10)
      // ----------------------------------------------------
      const saleId = await saleService.create({
        customer_id: customer.id,
        payment_method: "Dinheiro",
        items: [
          {
            product_id: product.id,
            quantity: 10,
            unit_price: 8.0,
          } as any,
        ],
      })

      expect(saleId).toBeDefined()
      expect(typeof saleId).toBe("string")

      const salesList = await saleService.list({ page: 1, limit: 50 })
      const createdSale = salesList.data.find((s) => s.id === saleId)
      expect(createdSale).toBeDefined()
      expect(Number(createdSale?.total)).toBe(80.0)

      // Validar baixa de estoque (50 - 10 = 40)
      const updatedProdAfterSale = await productService.getById(product.id)
      expect(Number(updatedProdAfterSale.current_stock)).toBe(40)

      // Validar saldo do caixa (100 + 80 = 180)
      const currentCash = await cashService.getCurrent()
      expect(currentCash).toBeDefined()
      expect(Number(currentCash?.current_balance)).toBe(180.0)

      // ----------------------------------------------------
      // TESTE 09 — BLOQUEIO DE ESTOQUE NEGATIVO (Venda de 100 un)
      // ----------------------------------------------------
      let errorThrown: any = null
      try {
        await saleService.create({
          customer_id: customer.id,
          payment_method: "Dinheiro",
          items: [
            {
              product_id: product.id,
              quantity: 100,
              unit_price: 8.0,
            } as any,
          ],
        })
      } catch (err: any) {
        errorThrown = err
      }

      expect(errorThrown).toBeDefined()
      expect(String(errorThrown.message || errorThrown)).toMatch(/Estoque insuficiente/i)

      // Garantir que o estoque permaneceu 40 e o caixa permaneceu 180
      const prodAfterBlockedSale = await productService.getById(product.id)
      expect(Number(prodAfterBlockedSale.current_stock)).toBe(40)

      const cashAfterBlockedSale = await cashService.getCurrent()
      expect(Number(cashAfterBlockedSale?.current_balance)).toBe(180.0)

      // ----------------------------------------------------
      // TESTE 10 & 11 — CONCORRÊNCIA E INTEGRIDADE TRANSACIONAL
      // ----------------------------------------------------
      // Criar produto exclusivo de concorrência com 1 unidade
      const rareProd = await productService.create({
        name: "Item Raro 1un",
        category_id: cat.id,
        brand_id: brand.id,
        sku: "RARE-01",
        purchase_price: 10.0,
        sale_price: 20.0,
        minimum_stock: 1,
        current_stock: 1,
        active: true,
      } as any)

      // Disparar duas vendas simultâneas tentando consumir 1 unidade
      const salePromise1 = saleService.create({
        customer_id: customer.id,
        payment_method: "Dinheiro",
        items: [{ product_id: rareProd.id, quantity: 1, unit_price: 20.0 } as any],
      })
      const salePromise2 = saleService.create({
        customer_id: customer.id,
        payment_method: "Dinheiro",
        items: [{ product_id: rareProd.id, quantity: 1, unit_price: 20.0 } as any],
      })

      const results = await Promise.allSettled([salePromise1, salePromise2])
      const fulfilled = results.filter((r) => r.status === "fulfilled")
      const rejected = results.filter((r) => r.status === "rejected")

      expect(fulfilled.length).toBe(1)
      expect(rejected.length).toBe(1)

      // Estoque final da mercadoria rara deve ser estritamente 0
      const rareProdAfterConcur = await productService.getById(rareProd.id)
      expect(Number(rareProdAfterConcur.current_stock)).toBe(0)

      // ----------------------------------------------------
      // TESTE 12 — DASHBOARD
      // ----------------------------------------------------
      const summary = await dashboardService.getSummary()
      expect(summary).toBeDefined()
      expect(summary.todayTotal).toBeGreaterThanOrEqual(80.0)
      expect(summary.todayOrders).toBeGreaterThanOrEqual(1)

      // ----------------------------------------------------
      // TESTE 13 — FECHAMENTO DE CAIXA
      // ----------------------------------------------------
      const closedCash = await cashService.close({
        final_value: 180.0 + 20.0, // 100 inicial + 80 venda 1 + 20 venda da concorrência
        notes: "Fechamento de caixa teste auditoria E2E",
      })

      expect(closedCash).toBeDefined()
      expect(closedCash.status.toUpperCase()).toBe("FECHADO")
    },
    90000
  )
})
