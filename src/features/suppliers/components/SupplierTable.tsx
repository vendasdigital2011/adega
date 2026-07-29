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
                <div className="flex justify-end items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => onEdit(supplier)} className="h-8 gap-1.5 px-2.5">
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                  {supplier.active ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleActive(supplier, false)}
                      className="h-8 gap-1.5 px-2 text-destructive hover:text-destructive"
                      title="Inativar"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      Inativar
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleActive(supplier, true)}
                      className="h-8 gap-1.5 px-2 text-success hover:text-success"
                      title="Reativar"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Reativar
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
