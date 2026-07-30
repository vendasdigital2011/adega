"use client"

import React from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { useAuth } from "@/hooks/useAuth"
import { Loading } from "@/components/ui/Loading"
import { useRouter } from "next/navigation"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isMobileOpen, setIsMobileOpen] = React.useState(false)

  // In Next.js, we also protect routes inside the middleware,
  // but client-side loading checks provide immediate visual safety.
  React.useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return <Loading fullScreen size="lg" />
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Navigation sidebar */}
      <Sidebar isMobileOpen={isMobileOpen} onMobileClose={() => setIsMobileOpen(false)} />

      {/* Main viewport */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        {/* Header bar */}
        <Header onToggleMobileMenu={() => setIsMobileOpen(!isMobileOpen)} />

        {/* Scrollable content pane */}
        <main className="flex-1 p-3 sm:p-6 overflow-y-auto bg-background/50">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}
