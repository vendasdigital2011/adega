/**
 * Tempos de vida (TTL) padronizados em segundos conforme PDR-011.
 */
export const CACHE_TTL = {
  /** 60 segundos */
  DASHBOARD: 60,
  /** 120 segundos (2 minutos) */
  PRODUCTS: 120,
  /** 900 segundos (15 minutos) */
  CATEGORIES: 900,
  /** 900 segundos (15 minutos) */
  BRANDS: 900,
  /** 1800 segundos (30 minutos) */
  SETTINGS: 1800,
  /** 1800 segundos (30 minutos) */
  COMPANY: 1800,
  /** 300 segundos (5 minutos) */
  PERMISSIONS: 300,
  /** 600 segundos (10 minutos) */
  REPORTS: 600,
  /** 300 segundos (5 minutos) */
  TOP_PRODUCTS: 300,
  /** 30 segundos */
  ALERTS: 30,
} as const
