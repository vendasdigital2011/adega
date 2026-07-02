"use client"

import React, { useEffect } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { Button } from "./Button"
import { cn } from "@/lib/utils"

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  side?: "left" | "right"
}

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  side = "right",
}: DrawerProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    if (isOpen) {
      document.body.style.overflow = "hidden"
      window.addEventListener("keydown", handleEscape)
    }

    return () => {
      document.body.style.overflow = "unset"
      window.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sideClasses = {
    right: "right-0 h-full w-full max-w-md border-l animate-in slide-in-from-right",
    left: "left-0 h-full w-full max-w-md border-r animate-in slide-in-from-left",
  }

  const drawerElement = (
    <div className="fixed inset-0 z-50 flex bg-background/80 backdrop-blur-sm">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Panel */}
      <div
        className={cn(
          "absolute bg-card text-card-foreground shadow-lg flex flex-col h-full focus:outline-none",
          sideClasses[side]
        )}
      >
        {/* Header */}
        <div className="flex flex-col space-y-1.5 p-6 border-b border-border/30 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 h-8 w-8 rounded-full"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold leading-none tracking-tight">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-2 p-6 border-t border-border/30 bg-muted/10">
            {footer}
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(drawerElement, document.body)
}
