import { AIFinancialContext, FinancialContextData } from "./AIFinancialContext"
import { AIInventoryContext, InventoryContextData } from "./AIInventoryContext"
import { AISalesContext, SalesContextData } from "./AISalesContext"
import { AIPurchasesContext, PurchasesContextData } from "./AIPurchasesContext"
import { AICashContext, CashContextData } from "./AICashContext"

export interface AIContextPayload {
  prompt: string
  companyId: string
  userId: string
  financial?: FinancialContextData
  inventory?: InventoryContextData
  sales?: SalesContextData
  purchases?: PurchasesContextData
  cash?: CashContextData
  formattedContextText: string
}

export class AIContextService {
  public static async assembleContext(companyId: string, userId: string, prompt: string): Promise<AIContextPayload> {
    const p = prompt.toLowerCase()

    let financial: FinancialContextData | undefined
    let inventory: InventoryContextData | undefined
    let sales: SalesContextData | undefined
    let purchases: PurchasesContextData | undefined
    let cash: CashContextData | undefined

    const isFinancial = p.includes("lucro") || p.includes("financeiro") || p.includes("despesa") || p.includes("pagar") || p.includes("receber")
    const isInventory = p.includes("estoque") || p.includes("produto") || p.includes("compra") || p.includes("comprar") || p.includes("falta") || p.includes("parado") || p.includes("repor") || p.includes("vencimento")
    const isSales = p.includes("vendi") || p.includes("venda") || p.includes("faturamento") || p.includes("ticket") || p.includes("hoje") || p.includes("mês")
    const isPurchases = p.includes("fornecedor") || p.includes("compras") || p.includes("pedido")
    const isCash = p.includes("caixa") || p.includes("saldo") || p.includes("troco")

    const contextParts: string[] = []

    if (isSales || (!isFinancial && !isInventory && !isPurchases && !isCash)) {
      sales = await AISalesContext.getContext(companyId)
      contextParts.push(`[DADOS DE VENDAS REAIS]: ${sales.details_summary}`)
    }

    if (isCash || (!isFinancial && !isInventory && !isPurchases && !isSales)) {
      cash = await AICashContext.getContext(companyId)
      contextParts.push(`[DADOS DO CAIXA REAL]: ${cash.details_summary}`)
    }

    if (isInventory || (!isFinancial && !isSales && !isPurchases && !isCash)) {
      inventory = await AIInventoryContext.getContext(companyId)
      contextParts.push(`[DADOS DO ESTOQUE REAL]: ${inventory.details_summary}`)
      if (inventory.low_stock_items.length > 0) {
        const itemsList = inventory.low_stock_items.map((it) => `${it.name} (Atual: ${it.current_stock}, Mín: ${it.minimum_stock})`).join("; ")
        contextParts.push(`[PRODUTOS EM ESTOQUE MÍNIMO]: ${itemsList}`)
      }
    }

    if (isFinancial) {
      financial = await AIFinancialContext.getContext(companyId)
      contextParts.push(`[DADOS FINANCEIROS REAIS]: ${financial.details_summary}`)
    }

    if (isPurchases) {
      purchases = await AIPurchasesContext.getContext(companyId)
      contextParts.push(`[DADOS DE COMPRAS E FORNECEDORES REAIS]: ${purchases.details_summary}`)
    }

    return {
      prompt,
      companyId,
      userId,
      financial,
      inventory,
      sales,
      purchases,
      cash,
      formattedContextText: contextParts.join("\n"),
    }
  }
}
