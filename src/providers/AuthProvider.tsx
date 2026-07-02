"use client"

import React, { createContext, useState, useEffect, ReactNode } from "react"
import { authService } from "@/services/AuthService"
import { User, Company, Role, Permission } from "@/types"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: User | null
  company: Company | null
  role: Role | null
  permissions: Permission[]
  loading: boolean
  login: (email: string, password: string) => Promise<unknown>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<unknown>
  updatePassword: (password: string) => Promise<unknown>
  refreshSession: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const router = useRouter()

  // Load user data
  const loadUser = async () => {
    try {
      setLoading(true)
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
    } catch (e) {
      console.error("Failed to load user session info:", e)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    loadUser()

    // Ouve alterações no estado de autenticação (Sign in, Sign out, Token Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[Supabase Auth Event] ${event}`)
      if (session?.user) {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          await loadUser()
        }
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const data = await authService.signIn(email, password)
      await loadUser()
      router.push("/dashboard")
      return data
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await authService.signOut()
      setUser(null)
      router.push("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    return await authService.forgotPassword(email, `${origin}/reset-password`)
  }

  const updatePassword = async (password: string) => {
    return await authService.updatePassword(password)
  }

  const refreshSession = async () => {
    await authService.refreshSession()
    await loadUser()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        company: user?.company || null,
        role: user?.role || null,
        permissions: user?.permissions || [],
        loading,
        login,
        logout,
        resetPassword,
        updatePassword,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
