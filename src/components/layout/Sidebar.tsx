"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { usePermission } from "@/hooks/usePermission"
import {
  LayoutDashboard,
  Wine,
  Tags,
  Bookmark,
  Boxes,
  ShoppingCart,
  DollarSign,
  Users,
  Truck,
  LineChart,
  Wallet,
  FileText,
  Settings,
  UserCog,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const canViewUsers = usePermission("users.view")
  const canViewFinancial = usePermission("financial.view")

  const menuItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/products", label: "Produtos", icon: Wine },
    { href: "/categories", label: "Categorias", icon: Tags },
    { href: "/brands", label: "Marcas", icon: Bookmark },
    { href: "/inventory", label: "Estoque", icon: Boxes },
    { href: "/purchases", label: "Compras", icon: ShoppingCart },
    { href: "/sales", label: "Vendas", icon: DollarSign },
    { href: "/customers", label: "Clientes", icon: Users },
    { href: "/suppliers", label: "Fornecedores", icon: Truck },
    ...(canViewFinancial ? [{ href: "/financial", label: "Financeiro", icon: LineChart }] : []),
    { href: "/cash", label: "Caixa", icon: Wallet },
    { href: "/reports", label: "Relatórios", icon: FileText },
    ...(canViewUsers ? [{ href: "/users", label: "Usuários", icon: UserCog }] : []),
    { href: "/settings", label: "Configurações", icon: Settings },
  ]

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-border bg-card text-card-foreground transition-all duration-300 ease-in-out h-screen",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border/40">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold overflow-hidden select-none">
          <Wine className="h-6 w-6 text-primary shrink-0 animate-pulse" />
          {!isCollapsed && (
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              Adega Cloud
            </span>
          )}
        </Link>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex h-6 w-6 items-center justify-center rounded-md border border-border bg-muted hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Menus */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={cn("h-5 w-5 shrink-0", isActive ? "" : "group-hover:text-primary transition-colors")} />
              {!isCollapsed && <span>{item.label}</span>}
              {isCollapsed && (
                <span className="absolute left-full ml-4 rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Collapsed/Collapsible Footer Info */}
      <div className="p-4 border-t border-border/40">
        {!isCollapsed ? (
          <div className="text-[11px] text-muted-foreground text-center">
            v1.0.0 &copy; Adega Cloud
          </div>
        ) : (
          <div className="text-[11px] text-muted-foreground text-center font-bold">
            v1
          </div>
        )}
      </div>
    </aside>
  )
}
