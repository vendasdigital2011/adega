"use client"

import React from "react"
import { Calendar } from "lucide-react"
import { PeriodType } from "@/services/ai/AIContextService"

interface PeriodSelectorProps {
  value: PeriodType
  onChange: (period: PeriodType) => void
}

const PERIOD_OPTIONS: Array<{ value: PeriodType; label: string }> = [
  { value: "today", label: "Hoje" },
  { value: "7_days", label: "Últimos 7 dias" },
  { value: "30_days", label: "Últimos 30 dias (Padrão)" },
  { value: "this_month", label: "Este mês" },
  { value: "last_month", label: "Mês anterior" },
  { value: "90_days", label: "Últimos 90 dias" },
]

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-2 bg-background border border-border/80 px-3 py-1.5 rounded-xl shadow-sm text-sm">
      <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:inline">
        Período:
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as PeriodType)}
        className="bg-transparent font-medium text-foreground text-xs sm:text-sm focus:outline-none cursor-pointer"
      >
        {PERIOD_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-popover text-popover-foreground">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
