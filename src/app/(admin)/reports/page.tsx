"use client"

import React, { useState } from "react"
import { Download, FileSpreadsheet, FileText as FileTextIcon } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Select } from "@/components/ui/Select"
import { Input } from "@/components/ui/Input"
import { Loading } from "@/components/ui/Loading"
import { Badge } from "@/components/ui/Badge"
import { EmptyState } from "@/components/ui/EmptyState"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table"
import { PurchaseStatusBadge } from "@/features/purchases/components/PurchaseStatusBadge"
import { cn } from "@/lib/utils"
import { usePermission } from "@/hooks/usePermission"
import { formatCurrency, formatDate } from "@/utils/format"
import { exportToCsv, exportToPdf, ExportColumn } from "@/utils/export"
import {
  useProductsReport,
  useInventoryReport,
  usePurchasesReport,
  useSalesReport,
  useFinancialReport,
  useCustomersReport,
  useCashReport,
} from "@/features/reports/hooks/useReports"
import {
  MovementType,
  Product,
  InventoryMovement,
  Purchase,
  PurchaseStatus,
  Sale,
  SaleStatus,
  AccountReceivable,
  AccountPayable,
  CashRegister,
} from "@/types"
import { CustomerReportRow } from "@/services/ReportService"

type Tab = "products" | "inventory" | "purchases" | "sales" | "financial" | "customers" | "cash"

const TABS: { key: Tab; label: string }[] = [
  { key: "products", label: "Produtos" },
  { key: "inventory", label: "Estoque" },
  { key: "purchases", label: "Compras" },
  { key: "sales", label: "Vendas" },
  { key: "financial", label: "Financeiro" },
  { key: "customers", label: "Clientes" },
  { key: "cash", label: "Caixa" },
]

function firstDayOfMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}
function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>("products")
  const canView = usePermission("reports.view")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">Produtos, estoque, compras, vendas, financeiro, clientes e caixa.</p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border/40">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!canView ? (
        <Card className="bg-card/30 border-border/40">
          <CardContent className="py-8 text-center text-muted-foreground">
            Você não tem permissão para ver os relatórios.
          </CardContent>
        </Card>
      ) : (
        <>
          {tab === "products" && <ProductsReportTab />}
          {tab === "inventory" && <InventoryReportTab />}
          {tab === "purchases" && <PurchasesReportTab />}
          {tab === "sales" && <SalesReportTab />}
          {tab === "financial" && <FinancialReportTab />}
          {tab === "customers" && <CustomersReportTab />}
          {tab === "cash" && <CashReportTab />}
        </>
      )}
    </div>
  )
}

// ============================================================
// Botões de exportação (comuns a todas as abas)
// ============================================================
function ExportButtons<T>({
  title,
  columns,
  rows,
  filename,
}: {
  title: string
  columns: ExportColumn<T>[]
  rows: T[]
  filename: string
}) {
  const canExport = usePermission("reports.export")
  if (!canExport) return null

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => exportToPdf(title, columns, rows, filename)}>
        <FileTextIcon className="mr-2 h-4 w-4" /> PDF
      </Button>
      <Button variant="outline" size="sm" onClick={() => exportToCsv(columns, rows, filename)}>
        <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
      </Button>
    </div>
  )
}

function ReportToolbar({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-wrap items-end gap-3">{children}</div>
      {right}
    </div>
  )
}

// ============================================================
// Produtos
// ============================================================
function ProductsReportTab() {
  const [active, setActive] = useState<string>("all")
  const { data, isLoading } = useProductsReport({ active: active === "all" ? undefined : active === "true" })
  const products = data || []

  const columns: ExportColumn<Product>[] = [
    { header: "Nome", value: (p) => p.name },
    { header: "SKU", value: (p) => p.sku },
    { header: "Categoria", value: (p) => p.category?.name || "-" },
    { header: "Marca", value: (p) => p.brand?.name || "-" },
    { header: "Estoque atual", value: (p) => String(p.current_stock) },
    { header: "Estoque mínimo", value: (p) => String(p.minimum_stock) },
    { header: "Preço de custo", value: (p) => formatCurrency(p.purchase_price) },
    { header: "Preço de venda", value: (p) => formatCurrency(p.sale_price) },
    { header: "Situação", value: (p) => (p.active ? "Ativo" : "Inativo") },
  ]

  const stockValue = products.reduce((sum, p) => sum + p.current_stock * Number(p.purchase_price || 0), 0)

  return (
    <Card className="bg-card/30 border-border/40">
      <CardContent className="pt-6 space-y-4">
        <ReportToolbar right={<ExportButtons title="Relatório de Produtos" columns={columns} rows={products} filename="relatorio-produtos" />}>
          <Select
            label="Situação"
            value={active}
            onChange={(e) => setActive(e.target.value)}
            options={[
              { value: "all", label: "Todas as situações" },
              { value: "true", label: "Ativo" },
              { value: "false", label: "Inativo" },
            ]}
          />
        </ReportToolbar>

        {isLoading ? (
          <Loading />
        ) : products.length === 0 ? (
          <EmptyState icon={Download} title="Nenhum produto encontrado" description="Ajuste os filtros." />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {products.length} produto(s) — valor em estoque (custo): <span className="font-semibold text-foreground">{formatCurrency(stockValue)}</span>
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Venda</TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">{p.sku}</TableCell>
                    <TableCell className="text-muted-foreground">{p.category?.name || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{p.brand?.name || "-"}</TableCell>
                    <TableCell className={cn("text-right", p.current_stock <= p.minimum_stock && "text-destructive font-medium")}>
                      {p.current_stock}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatCurrency(p.purchase_price)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.sale_price)}</TableCell>
                    <TableCell>
                      <Badge variant={p.active ? "success" : "secondary"}>{p.active ? "Ativo" : "Inativo"}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================
// Estoque
// ============================================================
const MOVEMENT_TYPES: MovementType[] = ["Entrada", "Saída", "Venda", "Compra", "Ajuste", "Inventário", "Perda", "Quebra"]

function InventoryReportTab() {
  const [startDate, setStartDate] = useState(firstDayOfMonth())
  const [endDate, setEndDate] = useState(today())
  const [movementType, setMovementType] = useState<string>("all")
  const { data, isLoading } = useInventoryReport({
    startDate,
    endDate,
    movementType: movementType === "all" ? undefined : (movementType as MovementType),
  })
  const movements = data || []

  const columns: ExportColumn<InventoryMovement>[] = [
    { header: "Data", value: (m) => formatDate(m.created_at) },
    { header: "Produto", value: (m) => m.product?.name || "-" },
    { header: "SKU", value: (m) => m.product?.sku || "-" },
    { header: "Tipo", value: (m) => m.movement_type },
    { header: "Quantidade", value: (m) => String(m.quantity) },
    { header: "Saldo anterior", value: (m) => String(m.previous_quantity) },
    { header: "Saldo atual", value: (m) => String(m.current_quantity) },
    { header: "Referência", value: (m) => m.reference || "-" },
  ]

  return (
    <Card className="bg-card/30 border-border/40">
      <CardContent className="pt-6 space-y-4">
        <ReportToolbar right={<ExportButtons title="Relatório de Estoque" columns={columns} rows={movements} filename="relatorio-estoque" />}>
          <Input label="De" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label="Até" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <Select
            label="Tipo"
            value={movementType}
            onChange={(e) => setMovementType(e.target.value)}
            options={[{ value: "all", label: "Todos os tipos" }, ...MOVEMENT_TYPES.map((t) => ({ value: t, label: t }))]}
          />
        </ReportToolbar>

        {isLoading ? (
          <Loading />
        ) : movements.length === 0 ? (
          <EmptyState icon={Download} title="Nenhuma movimentação encontrada" description="Ajuste o período ou o tipo." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Qtd.</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead>Referência</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{formatDate(m.created_at)}</TableCell>
                  <TableCell className="font-medium">
                    {m.product?.name || "-"}
                    {m.product?.sku && <span className="block text-xs text-muted-foreground">{m.product.sku}</span>}
                  </TableCell>
                  <TableCell>{m.movement_type}</TableCell>
                  <TableCell className="text-right">{m.quantity}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {m.previous_quantity} → <span className="font-medium text-foreground">{m.current_quantity}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{m.reference || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================
// Compras
// ============================================================
function PurchasesReportTab() {
  const [startDate, setStartDate] = useState(firstDayOfMonth())
  const [endDate, setEndDate] = useState(today())
  const [status, setStatus] = useState<string>("all")
  const { data, isLoading } = usePurchasesReport({
    startDate,
    endDate,
    status: status === "all" ? undefined : (status as PurchaseStatus),
  })
  const purchases = data || []
  const total = purchases.filter((p) => p.status !== "cancelada").reduce((sum, p) => sum + Number(p.total), 0)

  const columns: ExportColumn<Purchase>[] = [
    { header: "Data", value: (p) => formatDate(p.purchase_date) },
    { header: "Fornecedor", value: (p) => p.supplier?.name || "-" },
    { header: "Total", value: (p) => formatCurrency(p.total) },
    { header: "Situação", value: (p) => p.status },
  ]

  return (
    <Card className="bg-card/30 border-border/40">
      <CardContent className="pt-6 space-y-4">
        <ReportToolbar right={<ExportButtons title="Relatório de Compras" columns={columns} rows={purchases} filename="relatorio-compras" />}>
          <Input label="De" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label="Até" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <Select
            label="Situação"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: "all", label: "Todas as situações" },
              { value: "pendente", label: "Pendente" },
              { value: "recebida", label: "Recebida" },
              { value: "cancelada", label: "Cancelada" },
            ]}
          />
        </ReportToolbar>

        {isLoading ? (
          <Loading />
        ) : purchases.length === 0 ? (
          <EmptyState icon={Download} title="Nenhuma compra encontrada" description="Ajuste o período ou a situação." />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {purchases.length} compra(s) — total (não canceladas): <span className="font-semibold text-foreground">{formatCurrency(total)}</span>
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">{formatDate(p.purchase_date)}</TableCell>
                    <TableCell className="font-medium">{p.supplier?.name || "-"}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.total)}</TableCell>
                    <TableCell>
                      <PurchaseStatusBadge status={p.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================
// Vendas
// ============================================================
function SalesReportTab() {
  const [startDate, setStartDate] = useState(firstDayOfMonth())
  const [endDate, setEndDate] = useState(today())
  const [status, setStatus] = useState<string>("all")
  const { data, isLoading } = useSalesReport({
    startDate,
    endDate,
    status: status === "all" ? undefined : (status as SaleStatus),
  })
  const sales = data || []
  const finalized = sales.filter((s) => s.status === "finalizada")
  const total = finalized.reduce((sum, s) => sum + Number(s.total), 0)
  const ticket = finalized.length > 0 ? total / finalized.length : 0

  const columns: ExportColumn<Sale>[] = [
    { header: "Data", value: (s) => formatDate(s.sale_date) },
    { header: "Cliente", value: (s) => s.customer?.name || "Balcão" },
    { header: "Forma de pagamento", value: (s) => s.payment_method },
    { header: "Total", value: (s) => formatCurrency(s.total) },
    { header: "Situação", value: (s) => (s.status === "finalizada" ? "Finalizada" : "Cancelada") },
  ]

  return (
    <Card className="bg-card/30 border-border/40">
      <CardContent className="pt-6 space-y-4">
        <ReportToolbar right={<ExportButtons title="Relatório de Vendas" columns={columns} rows={sales} filename="relatorio-vendas" />}>
          <Input label="De" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label="Até" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <Select
            label="Situação"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: "all", label: "Todas as situações" },
              { value: "finalizada", label: "Finalizada" },
              { value: "cancelada", label: "Cancelada" },
            ]}
          />
        </ReportToolbar>

        {isLoading ? (
          <Loading />
        ) : sales.length === 0 ? (
          <EmptyState icon={Download} title="Nenhuma venda encontrada" description="Ajuste o período ou a situação." />
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total vendido</p>
                <p className="text-lg font-semibold">{formatCurrency(total)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Vendas finalizadas</p>
                <p className="text-lg font-semibold">{finalized.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Ticket médio</p>
                <p className="text-lg font-semibold">{formatCurrency(ticket)}</p>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">{formatDate(s.sale_date)}</TableCell>
                    <TableCell className="font-medium">{s.customer?.name || "Balcão"}</TableCell>
                    <TableCell className="text-muted-foreground">{s.payment_method}</TableCell>
                    <TableCell className="text-right">{formatCurrency(s.total)}</TableCell>
                    <TableCell>
                      <Badge variant={s.status === "finalizada" ? "success" : "destructive"}>
                        {s.status === "finalizada" ? "Finalizada" : "Cancelada"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================
// Financeiro
// ============================================================
function FinancialReportTab() {
  const [startDate, setStartDate] = useState(firstDayOfMonth())
  const [endDate, setEndDate] = useState(today())
  const { data, isLoading } = useFinancialReport({ startDate, endDate })

  const receivableColumns: ExportColumn<AccountReceivable>[] = [
    { header: "Vencimento", value: (r) => formatDate(r.due_date) },
    { header: "Descrição", value: (r) => r.description || "-" },
    { header: "Cliente", value: (r) => r.customer?.name || "Receita avulsa" },
    { header: "Valor", value: (r) => formatCurrency(r.amount) },
    { header: "Recebido", value: (r) => formatCurrency(r.received_amount) },
    { header: "Situação", value: (r) => r.status },
  ]
  const payableColumns: ExportColumn<AccountPayable>[] = [
    { header: "Vencimento", value: (p) => formatDate(p.due_date) },
    { header: "Descrição", value: (p) => p.description || "-" },
    { header: "Fornecedor", value: (p) => p.supplier?.name || "Despesa avulsa" },
    { header: "Valor", value: (p) => formatCurrency(p.amount) },
    { header: "Pago", value: (p) => formatCurrency(p.paid_amount) },
    { header: "Situação", value: (p) => p.status },
  ]

  return (
    <Card className="bg-card/30 border-border/40">
      <CardContent className="pt-6 space-y-4">
        <ReportToolbar>
          <Input label="De" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label="Até" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </ReportToolbar>

        {isLoading ? (
          <Loading />
        ) : !data ? null : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">A receber em aberto</p>
                <p className="text-lg font-semibold">{formatCurrency(data.totalReceivableOpen)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">A pagar em aberto</p>
                <p className="text-lg font-semibold">{formatCurrency(data.totalPayableOpen)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Recebido no período</p>
                <p className="text-lg font-semibold text-success">{formatCurrency(data.totalReceivedInPeriod)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Pago no período</p>
                <p className="text-lg font-semibold text-destructive">{formatCurrency(data.totalPaidInPeriod)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Contas a Receber (vencimento no período)</h3>
                <ExportButtons title="Contas a Receber" columns={receivableColumns} rows={data.receivables} filename="relatorio-contas-a-receber" />
              </div>
              {data.receivables.length === 0 ? (
                <EmptyState icon={Download} title="Nenhuma conta a receber no período" description="Ajuste o período." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Recebido</TableHead>
                      <TableHead>Situação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.receivables.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-muted-foreground whitespace-nowrap">{formatDate(r.due_date)}</TableCell>
                        <TableCell>{r.description || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{r.customer?.name || "Receita avulsa"}</TableCell>
                        <TableCell className="text-right">{formatCurrency(r.amount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(r.received_amount)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{r.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Contas a Pagar (vencimento no período)</h3>
                <ExportButtons title="Contas a Pagar" columns={payableColumns} rows={data.payables} filename="relatorio-contas-a-pagar" />
              </div>
              {data.payables.length === 0 ? (
                <EmptyState icon={Download} title="Nenhuma conta a pagar no período" description="Ajuste o período." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Pago</TableHead>
                      <TableHead>Situação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.payables.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-muted-foreground whitespace-nowrap">{formatDate(p.due_date)}</TableCell>
                        <TableCell>{p.description || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{p.supplier?.name || "Despesa avulsa"}</TableCell>
                        <TableCell className="text-right">{formatCurrency(p.amount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(p.paid_amount)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{p.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================
// Clientes
// ============================================================
function CustomersReportTab() {
  const { data, isLoading } = useCustomersReport()
  const customers = data || []

  const columns: ExportColumn<CustomerReportRow>[] = [
    { header: "Nome", value: (c) => c.name },
    { header: "Documento", value: (c) => c.document || "-" },
    { header: "Situação", value: (c) => (c.active ? "Ativo" : "Inativo") },
    { header: "Pedidos", value: (c) => String(c.orderCount) },
    { header: "Total gasto", value: (c) => formatCurrency(c.totalSpent) },
    { header: "Última compra", value: (c) => (c.lastPurchaseAt ? formatDate(c.lastPurchaseAt) : "-") },
  ]

  return (
    <Card className="bg-card/30 border-border/40">
      <CardContent className="pt-6 space-y-4">
        <ReportToolbar right={<ExportButtons title="Relatório de Clientes" columns={columns} rows={customers} filename="relatorio-clientes" />}>
          <p className="text-sm text-muted-foreground">Total gasto considera apenas vendas finalizadas.</p>
        </ReportToolbar>

        {isLoading ? (
          <Loading />
        ) : customers.length === 0 ? (
          <EmptyState icon={Download} title="Nenhum cliente encontrado" description="Cadastre clientes para ver o relatório." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="text-right">Pedidos</TableHead>
                <TableHead className="text-right">Total gasto</TableHead>
                <TableHead>Última compra</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.document || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={c.active ? "success" : "secondary"}>{c.active ? "Ativo" : "Inativo"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{c.orderCount}</TableCell>
                  <TableCell className="text-right">{formatCurrency(c.totalSpent)}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {c.lastPurchaseAt ? formatDate(c.lastPurchaseAt) : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================
// Caixa
// ============================================================
function CashReportTab() {
  const [startDate, setStartDate] = useState(firstDayOfMonth())
  const [endDate, setEndDate] = useState(today())
  const { data, isLoading } = useCashReport({ startDate, endDate })
  const registers = data || []

  const columns: ExportColumn<CashRegister>[] = [
    { header: "Abertura", value: (c) => formatDate(c.opened_at) },
    { header: "Fechamento", value: (c) => (c.closed_at ? formatDate(c.closed_at) : "-") },
    { header: "Aberto por", value: (c) => c.opened_by_user?.name || "-" },
    { header: "Valor inicial", value: (c) => formatCurrency(c.initial_value) },
    { header: "Valor final", value: (c) => (c.final_value !== null ? formatCurrency(c.final_value) : "-") },
    { header: "Diferença", value: (c) => (c.difference !== null ? formatCurrency(c.difference) : "-") },
    { header: "Situação", value: (c) => (c.status === "aberto" ? "Aberto" : "Fechado") },
  ]

  return (
    <Card className="bg-card/30 border-border/40">
      <CardContent className="pt-6 space-y-4">
        <ReportToolbar right={<ExportButtons title="Relatório de Caixa" columns={columns} rows={registers} filename="relatorio-caixa" />}>
          <Input label="De" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label="Até" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </ReportToolbar>

        {isLoading ? (
          <Loading />
        ) : registers.length === 0 ? (
          <EmptyState icon={Download} title="Nenhum caixa encontrado" description="Ajuste o período." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Abertura</TableHead>
                <TableHead>Fechamento</TableHead>
                <TableHead>Aberto por</TableHead>
                <TableHead className="text-right">Inicial</TableHead>
                <TableHead className="text-right">Final</TableHead>
                <TableHead className="text-right">Diferença</TableHead>
                <TableHead>Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{formatDate(c.opened_at)}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {c.closed_at ? formatDate(c.closed_at) : "-"}
                  </TableCell>
                  <TableCell>{c.opened_by_user?.name || "-"}</TableCell>
                  <TableCell className="text-right">{formatCurrency(c.initial_value)}</TableCell>
                  <TableCell className="text-right">{c.final_value !== null ? formatCurrency(c.final_value) : "-"}</TableCell>
                  <TableCell
                    className={cn(
                      "text-right",
                      c.difference !== null && c.difference !== 0 && "font-medium",
                      c.difference !== null && c.difference < 0 && "text-destructive",
                      c.difference !== null && c.difference > 0 && "text-success"
                    )}
                  >
                    {c.difference !== null ? formatCurrency(c.difference) : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.status === "aberto" ? "success" : "secondary"}>
                      {c.status === "aberto" ? "Aberto" : "Fechado"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
