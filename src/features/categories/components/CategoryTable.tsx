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
import { formatDate } from "@/utils/format"
import { Category } from "@/types"
import { Pencil, Ban, CheckCircle2, Tags } from "lucide-react"

interface CategoryTableProps {
  categories: Category[]
  onEdit: (category: Category) => void
  onToggleActive: (category: Category, active: boolean) => void
  canEdit?: boolean
  canToggle?: boolean
}

export function CategoryTable({
  categories,
  onEdit,
  onToggleActive,
  canEdit = true,
  canToggle = true,
}: CategoryTableProps) {
  const showActions = canEdit || canToggle

  if (categories.length === 0) {
    return (
      <EmptyState
        icon={Tags}
        title="Nenhuma categoria encontrada"
        description="Ajuste os filtros ou cadastre uma nova categoria."
      />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead>Situação</TableHead>
          <TableHead>Criada em</TableHead>
          {showActions && <TableHead className="text-right">Ações</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category) => (
          <TableRow key={category.id}>
            <TableCell className="font-medium">{category.name}</TableCell>
            <TableCell className="text-muted-foreground">{category.description || "-"}</TableCell>
            <TableCell>
              <Badge variant={category.active ? "success" : "secondary"}>
                {category.active ? "Ativa" : "Inativa"}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{formatDate(category.created_at)}</TableCell>
            {showActions && (
              <TableCell className="text-right">
                <div className="flex justify-end items-center gap-2">
                  {canEdit && (
                    <Button variant="outline" size="sm" onClick={() => onEdit(category)} className="h-8 gap-1.5 px-2.5">
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                  )}
                  {canToggle &&
                    (category.active ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleActive(category, false)}
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
                        onClick={() => onToggleActive(category, true)}
                        className="h-8 gap-1.5 px-2 text-success hover:text-success"
                        title="Reativar"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Reativar
                      </Button>
                    ))}
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
