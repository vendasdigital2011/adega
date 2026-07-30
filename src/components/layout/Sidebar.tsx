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
  History,
  ChevronLeft,
  ChevronRight,
  Menu,
  Sparkles,
} from "lucide-react"

interface SidebarProps {
  className?: string
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ className, isMobileOpen, onMobileClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const canViewUsers = usePermission("users.view")
  const canViewFinancial = usePermission("financial.view")
  const canViewAudit = usePermission("audit.view")
  const canViewReports = usePermission("reports.view")

  const menuItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/ai", label: "Inteligência IA", icon: Sparkles },
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
    ...(canViewReports ? [{ href: "/reports", label: "Relatórios", icon: FileText }] : []),
    ...(canViewAudit ? [{ href: "/audit", label: "Auditoria", icon: History }] : []),
    ...(canViewUsers ? [{ href: "/users", label: "Usuários", icon: UserCog }] : []),
    { href: "/settings", label: "Configurações", icon: Settings },
  ]

  const navContent = (
    <>
      <div className="flex h-16 items-center justify-between px-4 border-b border-border/40">
        <Link
          href="/dashboard"
          onClick={onMobileClose}
          className="flex items-center gap-2 font-bold overflow-hidden select-none"
        >
          <Wine className="h-6 w-6 text-primary shrink-0 animate-pulse" />
          {(!isCollapsed || isMobileOpen) && (
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              Adega Cloud
            </span>
          )}
        </Link>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex h-6 w-6 items-center justify-center rounded-md border border-border bg-muted hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        {/* Mobile Close Toggle */}
        {isMobileOpen && (
          <button
            onClick={onMobileClose}
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground"
          >
            ✕
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={isCollapsed && !isMobileOpen ? item.label : undefined}
            >
              <Icon className={cn("h-5 w-5 shrink-0", isActive ? "" : "group-hover:text-primary transition-colors")} />
              {(!isCollapsed || isMobileOpen) && <span>{item.label}</span>}
              {isCollapsed && !isMobileOpen && (
                <span className="absolute left-full ml-4 rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border/40">
        <div className="text-[11px] text-muted-foreground text-center">
          v1.0.0 &copy; Adega Cloud
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-card text-card-foreground transition-all duration-300 ease-in-out h-screen",
          isCollapsed ? "w-16" : "w-64",
          className
        )}
      >
        {navContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={onMobileClose}
          />
          <div className="relative z-50 w-72 max-w-[80vw] bg-card border-r border-border shadow-2xl flex flex-col h-full animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  )
}
