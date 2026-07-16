"use client"

import { useQuery } from "@tanstack/react-query"
import {
  reportService,
  ProductsReportOptions,
  InventoryReportOptions,
  PurchasesReportOptions,
  SalesReportOptions,
  FinancialReportOptions,
  CashReportOptions,
} from "@/services/ReportService"

export function useProductsReport(options: ProductsReportOptions) {
  return useQuery({
    queryKey: ["report-products", options],
    queryFn: () => reportService.getProductsReport(options),
  })
}

export function useInventoryReport(options: InventoryReportOptions) {
  return useQuery({
    queryKey: ["report-inventory", options],
    queryFn: () => reportService.getInventoryReport(options),
  })
}

export function usePurchasesReport(options: PurchasesReportOptions) {
  return useQuery({
    queryKey: ["report-purchases", options],
    queryFn: () => reportService.getPurchasesReport(options),
  })
}

export function useSalesReport(options: SalesReportOptions) {
  return useQuery({
    queryKey: ["report-sales", options],
    queryFn: () => reportService.getSalesReport(options),
  })
}

export function useFinancialReport(options: FinancialReportOptions) {
  return useQuery({
    queryKey: ["report-financial", options],
    queryFn: () => reportService.getFinancialReport(options),
  })
}

export function useCustomersReport() {
  return useQuery({
    queryKey: ["report-customers"],
    queryFn: () => reportService.getCustomersReport(),
  })
}

export function useCashReport(options: CashReportOptions) {
  return useQuery({
    queryKey: ["report-cash", options],
    queryFn: () => reportService.getCashReport(options),
  })
}
