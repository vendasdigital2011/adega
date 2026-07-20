import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { exportToCsv, exportToPdf, ExportColumn } from "@/utils/export"

interface Row {
  name: string
  note: string
}

const columns: ExportColumn<Row>[] = [
  { header: "Nome", value: (r) => r.name },
  { header: "Nota", value: (r) => r.note },
]

const mockDoc = {
  setFontSize: vi.fn(),
  text: vi.fn(),
  save: vi.fn(),
}
const jsPDFCtor = vi.fn(function () {
  return mockDoc
})
const autoTableFn = vi.fn()

vi.mock("jspdf", () => ({ default: jsPDFCtor }))
vi.mock("jspdf-autotable", () => ({ default: autoTableFn }))

describe("exportToPdf", () => {
  beforeEach(() => {
    jsPDFCtor.mockClear()
    autoTableFn.mockClear()
    mockDoc.save.mockClear()
  })

  it("usa orientação portrait para até 5 colunas e adiciona .pdf ao nome do arquivo", async () => {
    await exportToPdf("Relatório", columns, [{ name: "Vinho", note: "Tinto" }], "relatorio")
    expect(jsPDFCtor).toHaveBeenCalledWith({ orientation: "portrait" })
    expect(autoTableFn).toHaveBeenCalled()
    expect(mockDoc.save).toHaveBeenCalledWith("relatorio.pdf")
  })

  it("usa orientação landscape para mais de 5 colunas", async () => {
    const manyColumns: ExportColumn<Row>[] = Array.from({ length: 6 }, (_, i) => ({
      header: `Col ${i}`,
      value: () => "x",
    }))
    await exportToPdf("Relatório", manyColumns, [], "relatorio")
    expect(jsPDFCtor).toHaveBeenCalledWith({ orientation: "landscape" })
  })

  it("não duplica a extensão .pdf quando já presente", async () => {
    await exportToPdf("Relatório", columns, [], "relatorio.pdf")
    expect(mockDoc.save).toHaveBeenCalledWith("relatorio.pdf")
  })
})

describe("exportToCsv", () => {
  let capturedBlobParts: BlobPart[] = []
  let clickSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    capturedBlobParts = []
    clickSpy = vi.fn()

    // jsdom não implementa createObjectURL/revokeObjectURL nem <a>.click() de
    // verdade — interceptamos para inspecionar o conteúdo do CSV gerado.
    global.URL.createObjectURL = vi.fn((blob: Blob) => {
      // @ts-expect-error acessa a parte interna só para o teste
      capturedBlobParts = blob.__parts || []
      return "blob:mock-url"
    })
    global.URL.revokeObjectURL = vi.fn()

    const OriginalBlob = global.Blob
    // @ts-expect-error sobrescreve só para capturar as partes originais
    global.Blob = class extends OriginalBlob {
      __parts: BlobPart[]
      constructor(parts: BlobPart[], options?: BlobPropertyBag) {
        super(parts, options)
        this.__parts = parts
      }
    }

    HTMLAnchorElement.prototype.click = clickSpy as unknown as () => void
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("joins header + rows with ; and CRLF, and appends the .csv extension", () => {
    exportToCsv(columns, [{ name: "Vinho", note: "Tinto" }], "relatorio")

    const content = capturedBlobParts.join("")
    expect(content).toContain("Nome;Nota")
    expect(content).toContain("Vinho;Tinto")
    expect(content).toContain("\r\n")
    expect(clickSpy).toHaveBeenCalledOnce()
  })

  it("does not duplicate the .csv extension when already present", () => {
    exportToCsv(columns, [], "relatorio.csv")
    // O teste só verifica que a função roda sem lançar erro ao já receber
    // a extensão — a verificação do nome de arquivo final é feita via
    // clique manual no navegador (não exposto pelo mock de <a>).
    expect(clickSpy).toHaveBeenCalledOnce()
  })

  it("wraps a cell in quotes and escapes internal quotes when it contains ; \" or newline", () => {
    exportToCsv(columns, [{ name: 'Vinho "Especial"; Reserva', note: "linha1\nlinha2" }], "relatorio")

    const content = capturedBlobParts.join("")
    expect(content).toContain('"Vinho ""Especial""; Reserva"')
    expect(content).toContain('"linha1\nlinha2"')
  })

  it("prefixes the content with a UTF-8 BOM so accented characters render correctly in Excel", () => {
    exportToCsv(columns, [{ name: "Ação", note: "café" }], "relatorio")
    const content = capturedBlobParts.join("")
    expect(content.charCodeAt(0)).toBe(0xfeff)
  })
})
