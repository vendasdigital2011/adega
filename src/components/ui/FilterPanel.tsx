import React from "react"
import { Filter, X } from "lucide-react"
import { Button } from "./Button"
import { cn } from "@/lib/utils"

interface FilterPanelProps {
  isOpen: boolean
  onToggle: () => void
  onClear: () => void
  children: React.ReactNode
  activeFiltersCount?: number
  className?: string
}

export function FilterPanel({
  isOpen,
  onToggle,
  onClear,
  children,
  activeFiltersCount = 0,
  className,
}: FilterPanelProps) {
  return (
    <div className={cn("w-full flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2">
        <Button
          variant={activeFiltersCount > 0 ? "default" : "outline"}
          size="sm"
          onClick={onToggle}
          className="h-10 text-xs font-medium"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
          {activeFiltersCount > 0 && (
            <span className="ml-2 bg-primary-foreground text-primary rounded-full px-2 py-0.5 text-[10px] font-bold">
              {activeFiltersCount}
            </span>
          )}
        </Button>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear} className="h-10 text-xs text-muted-foreground hover:text-foreground">
            <X className="h-3 w-3 mr-1" />
            Limpar Filtros
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-border/80 rounded-lg bg-card/50 shadow-inner animate-in fade-in slide-in-from-top-1 duration-200 mt-2">
          {children}
        </div>
      )}
    </div>
  )
}
