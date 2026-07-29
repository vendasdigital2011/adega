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
import { Customer } from "@/types"
import { formatCurrency } from "@/utils/format"
import { Pencil, Ban, CheckCircle2, Users } from "lucide-react"

interface CustomerTableProps {
  customers: Customer[]
  onEdit: (customer: Customer) => void
  onToggleActive: (customer: Customer, active: boolean) => void
  canEdit?: boolean
}

export function CustomerTable({ customers, onEdit, onToggleActive, canEdit = true }: CustomerTableProps) {
  if (customers.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhum cliente encontrado"
        description="Ajuste os filtros ou cadastre um novo cliente."
      />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Documento</TableHead>
          <TableHead>Contato</TableHead>
          <TableHead>Cidade/UF</TableHead>
          <TableHead>Limite Fiado</TableHead>
          <TableHead>Situação</TableHead>
          {canEdit && <TableHead className="text-right">Ações</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((customer) => (
          <TableRow key={customer.id}>
            <TableCell className="font-medium">{customer.name}</TableCell>
            <TableCell className="text-muted-foreground">{customer.document || "-"}</TableCell>
            <TableCell className="text-muted-foreground">
              {customer.whatsapp || customer.phone || "-"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {customer.city ? `${customer.city}${customer.state ? "/" + customer.state : ""}` : "-"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {customer.credit_limit != null ? formatCurrency(customer.credit_limit) : "Sem limite"}
            </TableCell>
            <TableCell>
              <Badge variant={customer.active ? "success" : "secondary"}>
                {customer.active ? "Ativo" : "Inativo"}
              </Badge>
            </TableCell>
            {canEdit && (
              <TableCell className="text-right">
                <div className="flex justify-end items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => onEdit(customer)} className="h-8 gap-1.5 px-2.5">
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                  {customer.active ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleActive(customer, false)}
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
                      onClick={() => onToggleActive(customer, true)}
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
