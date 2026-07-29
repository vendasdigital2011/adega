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
import { Pencil, Ban, CheckCircle2, Lock, Users as UsersIcon } from "lucide-react"

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
                <div className="flex justify-end items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => onEdit(user)} className="h-8 gap-1.5 px-2.5">
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                  {user.status !== "active" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onChangeStatus(user, "active")}
                      className="h-8 gap-1.5 px-2 text-success hover:text-success"
                      title={user.status === "blocked" ? "Desbloquear" : "Reativar"}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {user.status === "blocked" ? "Desbloquear" : "Reativar"}
                    </Button>
                  )}
                  {user.status === "active" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onChangeStatus(user, "inactive")}
                      className="h-8 gap-1.5 px-2 text-muted-foreground"
                      title="Inativar"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      Inativar
                    </Button>
                  )}
                  {user.status !== "blocked" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onChangeStatus(user, "blocked")}
                      className="h-8 gap-1.5 px-2 text-destructive hover:text-destructive"
                      title="Bloquear"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      Bloquear
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
