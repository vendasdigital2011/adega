"use client"

import { useAuth } from "./useAuth"

export function usePermission(permissionName: string): boolean {
  const { permissions, role } = useAuth()
  if (role?.name === "Administrador" || role?.name === "Admin") return true
  return permissions.some((permission) => permission.name === permissionName)
}
