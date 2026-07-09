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
import { Supplier } from "@/types"
import { Pencil, Ban, CheckCircle2, Truck } from "lucide-react"

interface SupplierTableProps {
  suppliers: Supplier[]
  onEdit: (supplier: Supplier) => void
  onToggleActive: (supplier: Supplier, active: boolean) => void
  canEdit?: boolean
}

export function SupplierTable({ suppliers, onEdit, onToggleActive, canEdit = true }: SupplierTableProps) {
  if (suppliers.length === 0) {
    return (
      <EmptyState
        icon={Truck}
        title="Nenhum fornecedor encontrado"
        description="Ajuste os filtros ou cadastre um novo fornecedor."
      />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Documento</TableHead>
          <TableHead>Telefone</TableHead>
          <TableHead>Cidade/UF</TableHead>
          <TableHead>Situação</TableHead>
          {canEdit && <TableHead className="text-right">Ações</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {suppliers.map((supplier) => (
          <TableRow key={supplier.id}>
            <TableCell className="font-medium">{supplier.name}</TableCell>
            <TableCell className="text-muted-foreground">{supplier.document}</TableCell>
            <TableCell className="text-muted-foreground">{supplier.phone || "-"}</TableCell>
            <TableCell className="text-muted-foreground">
              {supplier.city ? `${supplier.city}${supplier.state ? "/" + supplier.state : ""}` : "-"}
            </TableCell>
            <TableCell>
              <Badge variant={supplier.active ? "success" : "secondary"}>
                {supplier.active ? "Ativo" : "Inativo"}
              </Badge>
            </TableCell>
            {canEdit && (
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(supplier)} title="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {supplier.active ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onToggleActive(supplier, false)}
                      title="Inativar"
                    >
                      <Ban className="h-4 w-4 text-destructive" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onToggleActive(supplier, true)}
                      title="Reativar"
                    >
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    </Button>
                  )}
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
