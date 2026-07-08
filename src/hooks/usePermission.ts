"use client"

import { useAuth } from "./useAuth"

export function usePermission(permissionName: string): boolean {
  const { permissions } = useAuth()
  return permissions.some((permission) => permission.name === permissionName)
}
