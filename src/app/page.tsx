"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Loading } from "@/components/ui/Loading"

export default function RootPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace("/dashboard")
      } else {
        router.replace("/login")
      }
    }
  }, [user, loading, router])

  // Fallback de segurança para modo PWA standalone
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) {
        router.replace("/login")
      }
    }, 1500)
    return () => clearTimeout(timer)
  }, [user, router])

  return <Loading fullScreen size="lg" />
}
