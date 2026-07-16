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
import { CostCenter } from "@/types"
import { Ban, CheckCircle2, Landmark } from "lucide-react"

interface CostCenterTableProps {
  costCenters: CostCenter[]
  onToggleActive: (costCenter: CostCenter, active: boolean) => void
  canToggle?: boolean
}

export function CostCenterTable({ costCenters, onToggleActive, canToggle = true }: CostCenterTableProps) {
  if (costCenters.length === 0) {
    return (
      <EmptyState
        icon={Landmark}
        title="Nenhum centro de custo cadastrado"
        description="Centros de custo ajudam a classificar despesas e receitas manuais."
      />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Situação</TableHead>
          {canToggle && <TableHead className="text-right">Ações</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {costCenters.map((cc) => (
          <TableRow key={cc.id}>
            <TableCell className="font-medium">{cc.name}</TableCell>
            <TableCell>
              <Badge variant={cc.active ? "success" : "secondary"}>{cc.active ? "Ativo" : "Inativo"}</Badge>
            </TableCell>
            {canToggle && (
              <TableCell className="text-right">
                {cc.active ? (
                  <Button variant="ghost" size="icon" onClick={() => onToggleActive(cc, false)} title="Inativar">
                    <Ban className="h-4 w-4 text-destructive" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon" onClick={() => onToggleActive(cc, true)} title="Reativar">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </Button>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
