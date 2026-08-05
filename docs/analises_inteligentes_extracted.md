


    
11-IA-ANALISE-NEGOCIO.md
Projeto
Nome:
 
Adega Cloud
Módulo:
 
Inteligência Artificial para Análise de Performance
Versão:
 
1.0
Objetivo
Implementar uma área de análises inteligentes no Adega Cloud para que o proprietário da adega consiga consultar rapidamente a situação do negócio por meio de botões pré-configurados e perguntas livres.
A IA deverá analisar dados reais do sistema e devolver diagnósticos claros, objetivos e acionáveis.
A OpenAI NÃO deverá receber o banco inteiro.
O backend deverá primeiro calcular indicadores e agregações utilizando dados do Supabase.
Depois deverá enviar apenas o contexto necessário para a OpenAI interpretar.
Arquitetura
Fluxo obrigatório:
Usuário
↓
Seleciona análise
↓
Backend identifica:
usuário;
empresa;
período;
análise selecionada.
↓
Supabase
↓
Services calculam indicadores
↓
AIContextService monta contexto estruturado
↓
OpenAI interpreta os resultados
↓
IA devolve diagnóstico
↓
Interface apresenta resultado
Regra Principal
O Supabase é a fonte oficial dos dados.
A IA nunca deverá inventar números.
Quando não existirem dados suficientes, responder claramente:
“Não existem dados suficientes para realizar esta análise.”
Área de Análises Inteligentes
Criar uma página ou seção chamada:
Análises Inteligentes
Exibir inicialmente 8 análises principais.
1 — ANALISAR MINHA ADEGA
Botão
Analisar minha adega
Pergunta interna
“Como está meu negócio?”
Objetivo
Executar uma análise geral da operação.
Verificar
Vendas
faturamento;
quantidade de vendas;
ticket médio;
faturamento do período anterior;
variação percentual.
Financeiro
receitas;
despesas;
lucro estimado;
margem;
contas a pagar;
contas a receber;
contas vencidas.
Estoque
quantidade total;
valor financeiro do estoque;
produtos zerados;
produtos abaixo do mínimo;
produtos com excesso;
produtos com baixo giro.
Produtos
mais vendidos;
menos vendidos;
maior faturamento;
maior margem.
Caixa
saldo;
entradas;
saídas;
sangrias;
suprimentos.
Resposta esperada
Apresentar:
Situação geral
🟢 Boa
ou
🟡 Atenção
ou
🔴 Crítica
Principais indicadores
faturamento;
lucro estimado;
margem;
ticket médio;
valor em estoque;
saldo do caixa.
Pontos positivos
Máximo 3.
Pontos de atenção
Máximo 3.
Problemas críticos
Máximo 3.
Recomendações
Máximo 5.
Prioridade
Informar uma ação prioritária para o proprietário executar.
2 — VENDAS E FATURAMENTO
Botão
Vendas e faturamento
Pergunta interna
“Como estão minhas vendas?”
Verificar
faturamento;
quantidade de vendas;
ticket médio;
produtos vendidos;
comparação com período anterior;
crescimento;
queda;
melhores dias;
piores dias;
formas de pagamento.
Calcular
Variação percentual do faturamento.
Variação no número de vendas.
Variação do ticket médio.
Resposta
Exemplo:
Faturamento:
R$ X
Variação:
+X%
Vendas:
X
Ticket médio:
R$ X
Produto líder:
Produto X
Ponto de atenção:
Descrição.
Recomendação:
Descrição.
3 — LUCRO E MARGEM
Botão
Lucro e margem
Pergunta interna
“Estou tendo lucro?”
Verificar
faturamento;
custo das mercadorias vendidas;
despesas;
receitas adicionais;
lucro bruto;
lucro estimado;
margem.
Regra
Não chamar faturamento de lucro.
A IA deverá diferenciar:
Receita
Custos
Despesas
Lucro
Margem
Resposta
Apresentar:
Faturamento
CMV
Despesas
Lucro estimado
Margem
Comparação com período anterior
Diagnóstico
Recomendação
4 — SITUAÇÃO DO ESTOQUE
Botão
Situação do estoque
Pergunta interna
“Como está meu estoque?”
Verificar
estoque total;
valor de custo;
valor potencial de venda;
produtos zerados;
abaixo do mínimo;
excesso;
movimentações recentes;
produtos sem movimentação.
Resposta
Mostrar:
Quantidade de produtos
Valor do estoque
Produtos zerados
Estoque baixo
Excesso
Produtos críticos
Recomendação
5 — GIRO DE PRODUTOS
Botão
Giro de produtos
Pergunta interna
“O que vende e o que está parado?”
Verificar
quantidade vendida;
faturamento por produto;
frequência de venda;
última venda;
estoque atual;
dias sem movimentação.
Classificação
Alta saída
Média saída
Baixa saída
Sem giro
Resposta
Mostrar:
Mais vendidos
Top 5.
Maior faturamento
Top 5.
Baixo giro
Top 5.
Sem movimentação
Top 5.
Recomendações
Sugerir:
reposição;
promoção;
redução de compra;
acompanhamento.
6 — SUGESTÃO DE COMPRAS
Botão
Sugestão de compras
Pergunta interna
“O que preciso comprar?”
Verificar
estoque atual;
estoque mínimo;
média de vendas;
giro;
última compra;
última venda;
quantidade vendida no período.
Prioridades
Classificar:
URGENTE
ALTA
MÉDIA
BAIXA
Regra
Não sugerir quantidade arbitrária.
Utilizar dados disponíveis para justificar a recomendação.
Resposta
Exemplo:
Produto:
Cerveja X
Estoque atual:
4
Estoque mínimo:
10
Vendas no período:
35
Prioridade:
URGENTE
Recomendação:
Repor estoque.
7 — SITUAÇÃO DO CAIXA
Botão
Situação do caixa
Pergunta interna
“Como está meu caixa?”
Verificar
caixa aberto;
saldo inicial;
entradas;
vendas;
saídas;
sangrias;
suprimentos;
saldo esperado;
divergência.
Resposta
Mostrar:
Status
Saldo inicial
Entradas
Saídas
Saldo esperado
Divergência
Diagnóstico
8 — ATENÇÃO NECESSÁRIA
Botão
O que precisa da minha atenção?
Pergunta interna
“Quais problemas ou riscos precisam da minha atenção agora?”
Objetivo
Criar uma análise consolidada de alertas.
Verificar
Estoque
produtos zerados;
estoque baixo;
excesso;
baixo giro.
Financeiro
contas vencidas;
contas próximas do vencimento;
aumento anormal de despesas.
Vendas
queda de faturamento;
queda de ticket;
redução de quantidade.
Caixa
divergências;
movimentações fora do padrão.
Classificação
🔴 Crítico
🟡 Atenção
🟢 Informativo
Resposta
Ordenar alertas por prioridade.
PERÍODO
Adicionar seletor antes das análises:
Hoje
7 dias
30 dias
Este mês
Mês anterior
90 dias
Personalizado
PERÍODO PADRÃO
Usar:
30 dias
quando o usuário não selecionar período.
COMPARAÇÃO
Sempre que possível comparar o período escolhido com o período imediatamente anterior de mesma duração.
Exemplo:
Últimos 30 dias
versus
30 dias anteriores.
PERGUNTA LIVRE
Além dos botões criar campo:
“Pergunte qualquer coisa sobre sua adega…”
Usuário poderá escrever perguntas como:
“Quanto vendi hoje?”
“Qual produto me dá mais lucro?”
“Quanto tenho para receber?”
“Quais produtos estão parados?”
“Como estão minhas despesas?”
“Qual fornecedor mais vende para mim?”
AI CONTEXT SERVICE
Criar:
src/services/ai/AIContextService.ts
Responsável por:
identificar intenção;
identificar período;
buscar dados;
calcular indicadores;
montar contexto;
enviar somente informações necessárias à OpenAI.
SERVICES
Criar ou organizar:
src/services/ai/
AIService.ts
AIContextService.ts
AISalesContext.ts
AIFinancialContext.ts
AIInventoryContext.ts
AICashContext.ts
AIPurchasesContext.ts
AIProductsContext.ts
AIAlertsContext.ts
REGRA DE CONSULTAS
Evitar consultas desnecessárias.
Exemplo:
Pergunta:
“Como está meu estoque?”
Consultar estoque e produtos.
Não consultar clientes e fornecedores sem necessidade.
AGREGAÇÃO
O backend deverá calcular indicadores antes de enviar dados para a OpenAI.
Exemplo:
{
 
“period”
:
 
“30_days”
,
 
“revenue”
: 28450,
 
“previousRevenue”
: 25311,
 
“salesCount”
: 347,
 
“averageTicket”
: 82,
 
“estimatedProfit”
: 7430,
 
“margin”
: 26.1,
 
“lowStockProducts”
: 8,
 
“outOfStockProducts”
: 3,
 
“slowMovingProducts”
: 17
 
}
A IA interpreta esses dados.
NÃO ENVIAR DADOS DESNECESSÁRIOS
Não enviar:
milhares de vendas;
banco completo;
dados pessoais desnecessários;
senhas;
tokens;
documentos sensíveis.
Enviar resumos e agregações.
SEGURANÇA
Toda análise deve respeitar:
usuário autenticado;
company_id;
RLS;
permissões;
perfil.
Nunca permitir dados de outra empresa.
OPENAI
A chamada deverá acontecer exclusivamente no backend.
Utilizar:
OPENAI_API_KEY
Nunca:
NEXT_PUBLIC_OPENAI_API_KEY
A chave nunca poderá aparecer no navegador.
CACHE
Permitir cache em análises agregadas.
Exemplo:
company:{companyId}:ai:dashboard:{period}
company:{companyId}:ai:sales:{period}
company:{companyId}:ai:inventory:{period}
TTL recomendado:
30 a 120 segundos.
Não utilizar cache para operações críticas.
INVALIDAÇÃO
Invalidar análises relacionadas após:
venda;
cancelamento de venda;
compra;
movimentação de estoque;
pagamento;
recebimento;
movimentação de caixa.
PADRÃO DE RESPOSTA DA IA
Toda análise deverá retornar estrutura consistente.
Título
Nome da análise.
Situação
Boa
Atenção
Crítica
Resumo
Máximo 3 parágrafos curtos.
Indicadores
Principais números.
Pontos positivos
Máximo 3.
Pontos de atenção
Máximo 3.
Recomendações
Máximo 5.
Prioridade
Uma ação principal.
ALUCINAÇÃO
A IA nunca deverá inventar:
vendas;
faturamento;
estoque;
lucro;
despesas;
clientes;
fornecedores.
Quando o dado não existir:
“Esse dado não está disponível no sistema para o período selecionado.”
INTERFACE
Criar cards para cada análise.
Cards:
ícone;
título;
descrição curta;
botão analisar.
Exemplo:
Vendas e faturamento
“Veja faturamento, ticket médio e evolução das vendas.”
[ Analisar ]
LOADING
Ao executar análise mostrar:
“Analisando seus dados…”
Evitar bloquear toda a interface.
ERROS
Diferenciar:
AI_NO_DATA
AI_SUPABASE_ERROR
AI_OPENAI_ERROR
AI_PERMISSION_ERROR
AI_TIMEOUT
Mostrar mensagem amigável.
AUDITORIA
Registrar:
user_id;
company_id;
análise;
período;
data;
status;
tempo da análise.
Não registrar conteúdo sensível.
TESTES
Criar testes para todas as análises.
Teste 01
Analisar minha adega.
Validar indicadores com banco.
Teste 02
Vendas.
Comparar faturamento.
Teste 03
Lucro.
Validar cálculo.
Teste 04
Estoque.
Validar produtos críticos.
Teste 05
Giro.
Validar ranking.
Teste 06
Compras.
Validar sugestões.
Teste 07
Caixa.
Validar saldo.
Teste 08
Alertas.
Validar prioridades.
TESTE SEM DADOS
Empresa sem vendas.
IA deve informar ausência de dados.
Não inventar análise.
TESTE MULTIEMPRESA
Empresa A nunca poderá receber informações da Empresa B.
TESTE OPENAI
Simular indisponibilidade da API.
A aplicação deverá continuar funcionando normalmente.
Somente a análise IA poderá ficar indisponível.
CRITÉRIOS DE ACEITE
Considerar concluído quando:
8 análises estiverem disponíveis;
seletor de período funcionar;
perguntas livres funcionarem;
dados vierem do Supabase real;
backend calcular indicadores;
OpenAI interpretar os dados;
respostas não inventarem valores;
cache funcionar;
segurança multiempresa funcionar;
erros forem tratados;
testes passarem.
NÃO FAZER
Não:
enviar banco inteiro para OpenAI;
calcular tudo via prompt;
usar company_id fixo;
criar dados mockados em produção;
expor OPENAI_API_KEY;
depender da IA para calcular valores críticos;
ignorar RLS;
permitir acesso entre empresas.
RELATÓRIO FINAL
Ao finalizar informar:
arquivos criados;
arquivos alterados;
services criados;
queries criadas;
agregações criadas;
cache implementado;
modelo OpenAI utilizado;
testes executados;
resultado do build;
pendências.
Não iniciar novas funcionalidades além do definido neste documento.

      

        
                
        