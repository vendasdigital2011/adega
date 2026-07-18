export interface ExportColumn<T> {
  header: string
  value: (row: T) => string
}

// jsPDF + jspdf-autotable só são carregados quando o usuário realmente clica
// em exportar — evita ~100KB no bundle inicial de páginas com botão de
// exportação (Relatórios, Auditoria) que a maioria das visitas não usa.
export async function exportToPdf<T>(title: string, columns: ExportColumn<T>[], rows: T[], filename: string): Promise<void> {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ])

  const doc = new jsPDF({ orientation: columns.length > 5 ? "landscape" : "portrait" })
  doc.setFontSize(14)
  doc.text(title, 14, 15)
  doc.setFontSize(9)
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 14, 21)

  autoTable(doc, {
    startY: 26,
    head: [columns.map((c) => c.header)],
    body: rows.map((row) => columns.map((c) => c.value(row))),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [40, 40, 40] },
  })

  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`)
}

// Excel (pt-BR) reconhece ";" como separador de lista nativamente; o BOM UTF-8
// garante que acentos sejam exibidos corretamente ao abrir o arquivo.
export function exportToCsv<T>(columns: ExportColumn<T>[], rows: T[], filename: string): void {
  const escapeCell = (value: string) => {
    if (/[";\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  const lines = [
    columns.map((c) => escapeCell(c.header)).join(";"),
    ...rows.map((row) => columns.map((c) => escapeCell(c.value(row))).join(";")),
  ]
  const csvContent = "﻿" + lines.join("\r\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
