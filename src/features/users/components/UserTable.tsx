"use client"

import React from "react"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table"
import { Button } from "@/components/ui/Button"
import { EmptyState } from "@/components/ui/EmptyState"
import { UserStatusBadge } from "./UserStatusBadge"
import { formatDate } from "@/utils/format"
import { User, UserStatus } from "@/types"
import { Pencil, Ban, CheckCircle2, Users as UsersIcon } from "lucide-react"

interface UserTableProps {
  users: User[]
  onEdit: (user: User) => void
  onChangeStatus: (user: User, status: UserStatus) => void
  canEdit?: boolean
}

export function UserTable({ users, onEdit, onChangeStatus, canEdit = true }: UserTableProps) {
  if (users.length === 0) {
    return (
      <EmptyState
        icon={UsersIcon}
        title="Nenhum usuário encontrado"
        description="Ajuste os filtros ou cadastre um novo usuário."
      />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>E-mail</TableHead>
          <TableHead>Perfil</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Último acesso</TableHead>
          {canEdit && <TableHead className="text-right">Ações</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell className="text-muted-foreground">{user.email}</TableCell>
            <TableCell>{user.role?.name || "-"}</TableCell>
            <TableCell>
              <UserStatusBadge status={user.status} />
            </TableCell>
            <TableCell className="text-muted-foreground">{formatDate(user.last_login)}</TableCell>
            {canEdit && (
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(user)} title="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {user.status === "active" ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onChangeStatus(user, "inactive")}
                      title="Inativar"
                    >
                      <Ban className="h-4 w-4 text-destructive" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onChangeStatus(user, "active")}
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
