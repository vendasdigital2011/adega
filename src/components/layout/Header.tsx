"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { useTheme } from "@/hooks/useTheme"
import { Breadcrumb } from "./Breadcrumb"
import { Avatar } from "../ui/Avatar"
import { Button } from "../ui/Button"
import { Sun, Moon, Bell, LogOut, User, Search, Settings, Shield } from "lucide-react"
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/features/notifications/hooks/useNotifications"
import { formatRelativeTime } from "@/utils/format"
import { NotificationType } from "@/types"

const NOTIFICATION_LINK: Record<NotificationType, string> = {
  estoque_baixo: "/inventory",
  financeiro_receber: "/financial",
  financeiro_pagar: "/financial",
  caixa_aberto: "/cash",
}

export function Header() {
  const { user, logout } = useAuth()
  const { toggleTheme, isDark } = useTheme()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  // Fallbacks
  const userName = user?.name || "Funcionário"
  const userRole = user?.role?.name || "Operador"
  const userInitials = userName.split(" ").map(n => n[0]).join("").slice(0, 2)

  const { data: notificationData } = useNotifications()
  const notifications = notificationData?.data || []
  const unreadCount = notificationData?.unreadCount || 0
  const markAsRead = useMarkNotificationRead()
  const markAllAsRead = useMarkAllNotificationsRead()

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-border bg-card px-6 text-card-foreground">
      {/* Left side: Breadcrumbs */}
      <div className="flex items-center">
        <Breadcrumb />
      </div>

      {/* Right side: Global Actions & User Profile */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:flex items-center text-muted-foreground">
          <Search className="absolute left-3 h-4 w-4 pointer-events-none" />
          <input
            type="text"
            placeholder="Pesquisar..."
            className="h-9 w-60 rounded-md border border-input bg-background pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowNotifications(!showNotifications)
              setShowUserMenu(false)
            }}
            className="h-9 w-9 rounded-full relative"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
            )}
          </Button>
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-md border border-border bg-card shadow-lg p-2 z-50 animate-in fade-in duration-200">
              <div className="px-3 py-2 font-semibold text-sm border-b border-border/40 flex justify-between items-center">
                <span>Notificações</span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead.mutate()}
                    className="text-xs text-primary font-normal cursor-pointer hover:underline"
                  >
                    Marcar como lidas
                  </button>
                )}
              </div>
              <div className="divide-y divide-border/40 max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-4 text-xs text-muted-foreground text-center">Nenhuma notificação.</p>
                ) : (
                  notifications.map((n) => (
                    <Link
                      key={n.id}
                      href={NOTIFICATION_LINK[n.type]}
                      onClick={() => {
                        setShowNotifications(false)
                        if (!n.read) markAsRead.mutate(n.id)
                      }}
                      className={`block p-3 text-xs hover:bg-muted/40 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
                    >
                      <p className="font-semibold text-foreground">{n.title}</p>
                      <p className="text-muted-foreground mt-0.5">{n.message}</p>
                      <span className="text-[10px] text-muted-foreground/60 block mt-1">
                        {formatRelativeTime(n.created_at)}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9 rounded-full"
          title="Alternar Tema"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* User Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu)
              setShowNotifications(false)
            }}
            className="flex items-center gap-2 focus:outline-none group select-none py-1.5 px-2.5 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Avatar fallback={userInitials} className="h-8 w-8 bg-primary text-primary-foreground font-semibold" />
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold leading-tight">{userName}</span>
              <span className="text-[10px] text-muted-foreground leading-tight flex items-center gap-0.5">
                <Shield className="h-2.5 w-2.5 text-primary" />
                {userRole}
              </span>
            </div>
          </button>
          
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-md border border-border bg-card shadow-lg p-1 z-50 animate-in fade-in duration-200">
              <div className="px-3 py-2 border-b border-border/40 mb-1">
                <p className="text-xs text-muted-foreground">Logado como</p>
                <p className="text-sm font-semibold truncate text-foreground">{user?.email}</p>
              </div>

              <Link
                href="/settings"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs rounded hover:bg-muted transition-colors text-foreground"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
                Configurações
              </Link>
              
              <Link
                href="/profile"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs rounded hover:bg-muted transition-colors text-foreground"
              >
                <User className="h-4 w-4 text-muted-foreground" />
                Meu Perfil
              </Link>

              <button
                onClick={async () => {
                  setShowUserMenu(false)
                  await logout()
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs rounded text-destructive hover:bg-destructive/10 transition-colors mt-1 border-t border-border/20 pt-2 text-left"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
