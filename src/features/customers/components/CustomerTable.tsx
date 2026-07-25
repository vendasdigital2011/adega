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
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(customer)} title="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {customer.active ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onToggleActive(customer, false)}
                      title="Inativar"
                    >
                      <Ban className="h-4 w-4 text-destructive" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onToggleActive(customer, true)}
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
