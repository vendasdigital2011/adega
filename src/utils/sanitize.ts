// O PostgREST usa vírgula para separar condições e parênteses para agrupar
// dentro do parâmetro `or=(...)`. Um valor de busca vindo direto do usuário
// que contenha esses caracteres pode alterar a estrutura do filtro montado
// por concatenação de string (ex.: `query.or(\`name.ilike.%${search}%\`)`).
// O RLS continua sendo a barreira real de acesso a dados, mas isso evita
// filtros malformados ou comportamento inesperado a partir de um campo de busca.
export function sanitizeSearchTerm(term: string): string {
  return term.replace(/[,()]/g, "").trim()
}
