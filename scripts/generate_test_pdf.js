const { jsPDF } = require("jspdf");
const autoTable = require("jspdf-autotable").default;
const fs = require("fs");
const path = require("path");

function generateTestPdf() {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryColor = [30, 41, 59]; // Slate 800
  const accentColor = [225, 29, 72]; // Rose 600

  // Capa / Cabeçalho Principal
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("ADEGA CLOUD - SISTEMA DE GESTÃO", 14, 18);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Roteiro Completo de Testes do Zero & Homologação", 14, 28);
  doc.setFontSize(9);
  doc.text(`Data da Emissão: ${new Date().toLocaleDateString("pt-BR")} | Versão 1.0`, 14, 34);

  let startY = 48;

  // Introdução
  doc.setTextColor(...primaryColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("1. Objetivo e Instruções de Uso", 14, startY);
  startY += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(50, 50, 50);
  const introText = [
    "Este roteiro foi elaborado especificamente para testar o sistema Adega Cloud a partir do estado inicial",
    "(sem nenhum cadastro ou lançamento). Ele guia o desenvolvedor e o cliente por uma simulação real de",
    "operação de uma adega: desde o setup de permissões, cadastro de produtos/fornecedores, controle de estoque,",
    "movimentação de caixa, vendas no PDV com validação de saldo, até os relatórios financeiros e inteligência."
  ];
  doc.text(introText, 14, startY);
  startY += 20;

  // Casos de Teste Estruturados em Tabela
  const testCases = [
    // Fase 1: Configurações & Permissões
    ["TC-01", "Configurações", "Configurar Permissões de Usuários", "Ir em Configurações > Permissões. Testar bloquear e liberar funções. Logar com usuário restrito e validar se o acesso é negado às telas bloqueadas.", "[  ] OK"],
    ["TC-02", "Configurações", "Empresa & Parâmetros", "Preencher dados da empresa/adega, regras de estoque mínimo e preferências do sistema.", "[  ] OK"],
    
    // Fase 2: Cadastros Base
    ["TC-03", "Cadastros Base", "Cadastro de Marcas", "Ir em Marcas > Nova Marca. Cadastrar 'Ambev', 'Heineken', 'Salton'. Verificar listagem e busca.", "[  ] OK"],
    ["TC-04", "Cadastros Base", "Cadastro de Categorias", "Ir em Categorias > Nova Categoria. Cadastrar 'Cervejas', 'Vinhos Finos', 'Destilados'.", "[  ] OK"],
    ["TC-05", "Cadastros Base", "Cadastro de Fornecedores", "Ir em Fornecedores > Novo. Cadastrar 'Distribuidora Silva' (CNPJ/Telefone/Email). Validar salvamento.", "[  ] OK"],
    ["TC-06", "Cadastros Base", "Cadastro de Clientes", "Ir em Clientes > Novo. Cadastrar 'João da Silva' e 'Maria Oliveira'. Verificar listagem na busca.", "[  ] OK"],

    // Fase 3: Produtos & Estoque Inicial
    ["TC-07", "Produtos", "Cadastro de Produtos (Estoque 0)", "Cadastrar Produto 'Cerveja Heineken 600ml' (Custo: R$ 6.50, Venda: R$ 10.00, Est. Mín: 10, Qtd Inicial: 0).", "[  ] OK"],
    ["TC-08", "Produtos", "Cadastro de Vinho (Estoque 0)", "Cadastrar 'Vinho Tinto Chileno 750ml' (Custo: R$ 25.00, Venda: R$ 45.00, Est. Mín: 5, Qtd Inicial: 0).", "[  ] OK"],

    // Fase 4: Compras & Entrada de Estoque
    ["TC-09", "Compras", "Lançar Pedido de Compra", "Ir em Compras > Nova Compra. Selecionar Fornecedor 'Distribuidora Silva'. Adicionar 50 un. de Heineken e 20 un. de Vinho. Finalizar compra.", "[  ] OK"],
    ["TC-10", "Estoque", "Verificação de Entradas", "Conferir se o saldo de estoque atualizou para 50 un. (Heineken) e 20 un. (Vinho). Conferir se o fornecedor foi gravado corretamente.", "[  ] OK"],
    ["TC-11", "Estoque", "Ajuste Manual de Estoque", "Ir em Estoque > Movimentação. Fazer uma movimentação manual de Entrada (+5 un.) e Saída por Avaria (-1 un.). Validar saldo final.", "[  ] OK"],

    // Fase 5: Frente de Caixa (PDV) & Operação
    ["TC-12", "Caixa", "Abertura de Caixa", "Ir em Caixa > Abrir Caixa. Informar saldo inicial de R$ 100,00 (troco). Confirmar abertura.", "[  ] OK"],
    ["TC-13", "Caixa", "Sangria e Suprimento", "Testar Suprimento (+ R$ 50,00) e Sangria (- R$ 20,00). Verificar se o histórico de movimentação do caixa reflete os lançamentos.", "[  ] OK"],

    // Fase 6: Vendas no PDV & Validações
    ["TC-14", "Vendas (PDV)", "Venda com Seleção de Cliente", "Iniciar Venda no PDV. Selecionar Cliente 'João da Silva'. Adicionar 5 un. Heineken (R$ 50,00) e 1 Vinho (R$ 45,00). Total R$ 95,00.", "[  ] OK"],
    ["TC-15", "Vendas (PDV)", "Validação de Valor Dinâmico", "Verificar se o valor total da venda é calculated dinamicamente com base nos itens (e não valor fixo R$ 100,00). Finalizar em PIX.", "[  ] OK"],
    ["TC-16", "Vendas (PDV)", "Validação de Bloqueio sem Saldo", "Tentar realizar uma venda de 500 unidades da Heineken (tendo apenas 49 no estoque). **Esperado:** Sistema deve emitir alerta e BLOQUEAR a venda.", "[  ] OK"],
    ["TC-17", "Vendas (PDV)", "Baixa Automática de Estoque", "Confirmar se após a venda de 5 un. de Heineken, o saldo de estoque diminuiu de 54 para 49 un. exatamente.", "[  ] OK"],

    // Fase 7: Financeiro & Fechamento
    ["TC-18", "Financeiro", "Contas a Pagar & Receber", "Ir em Financeiro. Validar se a compra gerou Conta a Pagar e a venda gerou Conta a Receber/Caixa. Registrar a baixa de um pagamento.", "[  ] OK"],
    ["TC-19", "Caixa", "Fechamento de Caixa", "Realizar o Fechamento do Caixa. Conferir resumo por meio de pagamento (Dinheiro, PIX, Cartão) e bater o valor esperado.", "[  ] OK"],

    // Fase 8: Dashboard, Relatórios & IA
    ["TC-20", "Dashboard", "Atualização de Gráficos", "Ir ao Dashboard. Validar se as vendas do dia, faturamento total, ticket médio e produtos mais vendidos atualizaram em tempo real.", "[  ] OK"],
    ["TC-21", "Relatórios", "Exportação PDF e CSV", "Ir em Relatórios. Filtrar vendas por período. Clicar no botão 'PDF' e 'CSV' e verificar o download do relatório formatado.", "[  ] OK"],
    ["TC-22", "Módulo IA", "Sugestões de Compra & Previsão", "Ir no Módulo de IA. Verificar se as métricas de giro de estoque, previsão de demanda e sugestão de reposição estão calculando adequadamente.", "[  ] OK"],
    ["TC-23", "Auditoria", "Log de Ações", "Ir em Auditoria. Confirmar se as ações de cadastro, vendas e alteração de estoque foram registradas com usuário, data e hora.", "[  ] OK"]
  ];

  autoTable(doc, {
    startY: startY,
    margin: { left: 14, right: 14 },
    tableWidth: "auto",
    head: [["ID", "Módulo", "Caso de Teste / Funcionalidade", "Procedimento de Teste & Resultado Esperado", "Status"]],
    body: testCases,
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      valign: "middle"
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold"
    },
    columnStyles: {
      0: { cellWidth: 12, fontStyle: "bold", textColor: accentColor },
      1: { cellWidth: 23, fontStyle: "bold" },
      2: { cellWidth: 39, fontStyle: "bold" },
      3: { cellWidth: 88 },
      4: { cellWidth: 16, halign: "center", fontStyle: "bold" }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didDrawPage: function (data) {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Adega Cloud - Documento de Testes e Homologação | Página ${data.pageNumber} de ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }
  });

  let finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 180) + 12;

  if (finalY > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage();
    finalY = 25;
  }

  // Termo de Homologação / Assinaturas
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text("3. Termo de Homologação e Aprovação do Cliente", 14, finalY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(
    "Declaro que todos os casos de teste acima descritos foram executados e validados no sistema Adega Cloud,",
    14,
    finalY + 6
  );
  doc.text(
    "atestando o correto funcionamento das regras de negócio, frente de vendas, estoque e módulo financeiro.",
    14,
    finalY + 11
  );

  const sigY = finalY + 30;
  doc.setLineWidth(0.5);
  doc.setDrawColor(150, 150, 150);
  doc.line(14, sigY, 95, sigY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("Desenvolvedor / Responsável Técnico", 14, sigY + 5);
  doc.setFont("helvetica", "normal");
  doc.text("Assinatura e Data", 14, sigY + 9);

  doc.line(115, sigY, 196, sigY);
  doc.setFont("helvetica", "bold");
  doc.text("Cliente / Proprietário da Adega", 115, sigY + 5);
  doc.setFont("helvetica", "normal");
  doc.text("Assinatura e Data", 115, sigY + 9);

  const outputDir = path.join(__dirname, "..", "docs");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "Roteiro_de_Testes_Adega_Cloud.pdf");
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  fs.writeFileSync(outputPath, pdfBuffer);

  console.log(`✅ PDF gerado com sucesso em: ${outputPath}`);
}

generateTestPdf();
