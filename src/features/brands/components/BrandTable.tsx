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
import { Brand } from "@/types"
import { Pencil, Ban, CheckCircle2, Bookmark } from "lucide-react"

interface BrandTableProps {
  brands: Brand[]
  onEdit: (brand: Brand) => void
  onToggleActive: (brand: Brand, active: boolean) => void
  canEdit?: boolean
  canToggle?: boolean
}

export function BrandTable({
  brands,
  onEdit,
  onToggleActive,
  canEdit = true,
  canToggle = true,
}: BrandTableProps) {
  const showActions = canEdit || canToggle

  if (brands.length === 0) {
    return (
      <EmptyState
        icon={Bookmark}
        title="Nenhuma marca encontrada"
        description="Ajuste os filtros ou cadastre uma nova marca."
      />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Situação</TableHead>
          <TableHead>Criada em</TableHead>
          {showActions && <TableHead className="text-right">Ações</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {brands.map((brand) => (
          <TableRow key={brand.id}>
            <TableCell className="font-medium">{brand.name}</TableCell>
            <TableCell>
              <Badge variant={brand.active ? "success" : "secondary"}>
                {brand.active ? "Ativa" : "Inativa"}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{formatDate(brand.created_at)}</TableCell>
            {showActions && (
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  {canEdit && (
                    <Button variant="ghost" size="icon" onClick={() => onEdit(brand)} title="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {canToggle &&
                    (brand.active ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onToggleActive(brand, false)}
                        title="Inativar"
                      >
                        <Ban className="h-4 w-4 text-destructive" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onToggleActive(brand, true)}
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
