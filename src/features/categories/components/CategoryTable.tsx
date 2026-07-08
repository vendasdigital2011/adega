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
                <div className="flex justify-end gap-1">
                  {canEdit && (
                    <Button variant="ghost" size="icon" onClick={() => onEdit(category)} title="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {canToggle &&
                    (category.active ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onToggleActive(category, false)}
                        title="Inativar"
                      >
                        <Ban className="h-4 w-4 text-destructive" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onToggleActive(category, true)}
                        title="Reativar"
                      >
                        <CheckCircle2 className="h-4 w-4 text-success" />
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
