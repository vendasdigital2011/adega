/**
 * Gerador de chaves padronizadas isoladas por empresa e usuário conforme PDR-011.
 * Formato: company:{companyId}:{modulo}:{identificador}
 */
export const CacheKeys = {
  dashboard: (companyId: string) => `company:${companyId}:dashboard`,
  categories: (companyId: string) => `company:${companyId}:categories`,
  brands: (companyId: string) => `company:${companyId}:brands`,
  productsList: (companyId: string, paramsStr = "all") => `company:${companyId}:products:list:${paramsStr}`,
  inventoryAlerts: (companyId: string) => `company:${companyId}:inventory:alerts`,
  financialSummary: (companyId: string) => `company:${companyId}:financial:summary`,
  report: (companyId: string, reportType: string, period = "default") =>
    `company:${companyId}:reports:${reportType}:${period}`,
  settings: (companyId: string) => `company:${companyId}:settings`,
  company: (companyId: string) => `company:${companyId}:company`,
  userPermissions: (userId: string) => `user:${userId}:permissions`,
  userProfile: (userId: string) => `user:${userId}:profile`,

  /** Padrões de invalidação */
  patterns: {
    allCompany: (companyId: string) => `company:${companyId}:*`,
    products: (companyId: string) => `company:${companyId}:products:*`,
    reports: (companyId: string) => `company:${companyId}:reports:*`,
  },
} as const
