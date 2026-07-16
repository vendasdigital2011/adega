/**
 * Formats a number to Brazilian Real (R$) currency format
 */
export function formatCurrency(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return "R$ 0,00"
  const numericValue = typeof value === "string" ? parseFloat(value) : value
  if (isNaN(numericValue)) return "R$ 0,00"
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numericValue)
}

/**
 * Formats a date string or object to DD/MM/YYYY format
 */
export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return "-"
  // Date-only strings ("YYYY-MM-DD") have no timezone info; parsing them with
  // `new Date()` treats them as UTC midnight, which shifts a day back when
  // formatted in a negative-offset timezone (e.g. America/Sao_Paulo). Parse
  // the components directly so the calendar date shown matches what was stored.
  const dateOnlyMatch = typeof date === "string" && date.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const d = dateOnlyMatch
    ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
    : typeof date === "string"
      ? new Date(date)
      : date
  if (isNaN(d.getTime())) return "-"
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

/**
 * Formats a date/time as a relative Portuguese string (ex: "há 10 minutos")
 */
export function formatRelativeTime(date: string | Date | undefined | null): string {
  if (!date) return "-"
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return "-"

  const diffMs = Date.now() - d.getTime()
  const diffMin = Math.round(diffMs / 60000)

  if (diffMin < 1) return "agora mesmo"
  if (diffMin < 60) return `há ${diffMin} min`
  const diffHours = Math.round(diffMin / 60)
  if (diffHours < 24) return `há ${diffHours}h`
  const diffDays = Math.round(diffHours / 24)
  if (diffDays === 1) return "ontem"
  if (diffDays < 30) return `há ${diffDays} dias`
  return formatDate(d)
}

/**
 * Formats a phone number string to (XX) XXXXX-XXXX or (XX) XXXX-XXXX format
 */
export function formatPhone(phone: string | undefined | null): string {
  if (!phone) return "-"
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.length === 11) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`
  } else if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`
  }
  return phone
}

/**
 * Formats a CPF or CNPJ document string
 */
export function formatDocument(document: string | undefined | null): string {
  if (!document) return "-"
  const cleaned = document.replace(/\D/g, "")
  if (cleaned.length === 11) {
    return `${cleaned.substring(0, 3)}.${cleaned.substring(3, 6)}.${cleaned.substring(6, 9)}-${cleaned.substring(9)}`
  } else if (cleaned.length === 14) {
    return `${cleaned.substring(0, 2)}.${cleaned.substring(2, 5)}.${cleaned.substring(5, 8)}/${cleaned.substring(8, 12)}-${cleaned.substring(12)}`
  }
  return document
}

/**
 * Calculates profit margin in percentage
 */
export function calculateMargin(purchasePrice: number, salePrice: number): number {
  if (!salePrice || salePrice <= 0) return 0
  const margin = ((salePrice - purchasePrice) / salePrice) * 100
  return parseFloat(margin.toFixed(2))
}
