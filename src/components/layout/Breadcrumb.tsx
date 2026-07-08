"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"

// Translations map for paths
const routeMap: Record<string, string> = {
  dashboard: "Dashboard",
  products: "Produtos",
  categories: "Categorias",
  inventory: "Estoque",
  purchases: "Compras",
  sales: "Vendas",
  customers: "Clientes",
  suppliers: "Fornecedores",
  financial: "Financeiro",
  cash: "Caixa",
  reports: "Relatórios",
  settings: "Configurações",
  profile: "Perfil",
  users: "Usuários",
  roles: "Perfis e Permissões",
  "access-denied": "Acesso Negado",
}

export function Breadcrumb() {
  const pathname = usePathname()
  if (pathname === "/login" || pathname === "/forgot-password" || pathname === "/reset-password") return null

  const paths = pathname.split("/").filter(Boolean)

  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground select-none mb-4">
      <Link href="/dashboard" className="hover:text-foreground transition-colors flex items-center">
        <Home className="h-4 w-4" />
      </Link>
      
      {paths.map((path, index) => {
        const url = `/${paths.slice(0, index + 1).join("/")}`
        const isLast = index === paths.length - 1
        const label = routeMap[path] || path

        return (
          <React.Fragment key={url}>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
            {isLast ? (
              <span className="font-medium text-foreground max-w-[200px] truncate">
                {label}
              </span>
            ) : (
              <Link href={url} className="hover:text-foreground transition-colors capitalize">
                {label}
              </Link>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
