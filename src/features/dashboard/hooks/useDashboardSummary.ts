"use client"

import { useQuery } from "@tanstack/react-query"
import { dashboardService } from "@/services/DashboardService"

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => dashboardService.getSummary(),
    // Dados do "hoje" ficam obsoletos rápido — refetch a cada 60s.
    refetchInterval: 60_000,
  })
}
