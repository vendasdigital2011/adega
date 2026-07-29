"use client"

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { EmptyState } from "@/components/ui/EmptyState"
import { formatCurrency, formatDate } from "@/utils/format"
import { Product } from "@/types"
import { Pencil, Ban, CheckCircle2, Wine, AlertTriangle } from "lucide-react"

// Determina o status de validade de um produto
function getExpiryStatus(expiryDate: string | null): { status: "expired" | "expiring" | "ok"; text: string } {
  if (!expiryDate) return { status: "ok", text: "" }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0)

  if (expiry < today) {
    return { status: "expired", text: "Vencido" }
  }

  const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (daysUntilExpiry <= 30) {
    return { status: "expiring", text: `Vence em ${daysUntilExpiry}d` }
  }

  return { status: "ok", text: formatDate(expiryDate) }
}

interface ProductTableProps {
  products: Product[]
  onEdit: (product: Product) => void
  onToggleActive: (product: Product, active: boolean) => void
  canEdit?: boolean
}

export function ProductTable({ products, onEdit, onToggleActive, canEdit = true }: ProductTableProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={Wine}
        title="Nenhum produto encontrado"
        description="Ajuste os filtros ou cadastre um novo produto."
      />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Produto</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Categoria</TableHead>
          <TableHead>Preço venda</TableHead>
          <TableHead>Estoque</TableHead>
          <TableHead>Validade</TableHead>
          <TableHead>Situação</TableHead>
          {canEdit && <TableHead className="text-right">Ações</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => {
          const lowStock = product.current_stock <= product.minimum_stock
          return (
            <TableRow key={product.id}>
              <TableCell className="font-medium">
                {product.name}
                {product.brand?.name && (
                  <span className="block text-xs text-muted-foreground">{product.brand.name}</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">{product.sku}</TableCell>
              <TableCell className="text-muted-foreground">{product.category?.name || "-"}</TableCell>
              <TableCell>{formatCurrency(product.sale_price)}</TableCell>
              <TableCell>
                <span className={lowStock ? "text-destructive font-medium" : ""}>
                  {product.current_stock}
                </span>
                <span className="text-xs text-muted-foreground"> / mín {product.minimum_stock}</span>
              </TableCell>
              <TableCell>
                {product.expiry_date ? (
                  () => {
                    const expiry = getExpiryStatus(product.expiry_date)
                    return (
                      <div className="flex items-center gap-1">
                        {expiry.status === "expired" && (
                          <>
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            <span className="text-xs text-destructive font-medium">{expiry.text}</span>
                          </>
                        )}
                        {expiry.status === "expiring" && (
                          <>
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            <span className="text-xs text-yellow-600">{expiry.text}</span>
                          </>
                        )}
                        {expiry.status === "ok" && <span className="text-xs text-muted-foreground">{expiry.text}</span>}
                      </div>
                    )
                  }
                )() : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={product.active ? "success" : "secondary"}>
                  {product.active ? "Ativo" : "Inativo"}
                </Badge>
              </TableCell>
              {canEdit && (
                <TableCell className="text-right">
                  <div className="flex justify-end items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEdit(product)} className="h-8 gap-1.5 px-2.5">
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                    {product.active ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleActive(product, false)}
                        className="h-8 gap-1.5 px-2 text-destructive hover:text-destructive"
                        title="Inativar produto"
                      >
                        <Ban className="h-3.5 w-3.5" />
                        Inativar
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleActive(product, true)}
                        className="h-8 gap-1.5 px-2 text-success hover:text-success"
                        title="Reativar produto"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Reativar
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
