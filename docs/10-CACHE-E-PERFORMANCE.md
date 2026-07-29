# PDR-011 — Cache e Performance

## Projeto

**Nome:** Adega Cloud

**Documento:** 10-CACHE-E-PERFORMANCE.md

**Versão:** 1.0

---

# Objetivo

Implementar uma camada de cache para reduzir a carga sobre o banco de dados PostgreSQL (Supabase), melhorar o tempo de resposta da aplicação e preparar a arquitetura para crescimento sem alterar a lógica de negócio.

O cache será uma camada auxiliar. A fonte oficial de todos os dados continuará sendo o Supabase.

---

# Stack de Cache

## Banco Principal

- Supabase PostgreSQL

## Cache Distribuído

- Upstash Redis

## Cache Cliente

- TanStack Query

## Cache de Servidor

- Next.js Cache

## Arquivos

- Supabase Storage + CDN

---

# Arquitetura

```
Cliente
     │
     ▼
Next.js
     │
     ▼
Redis (Upstash)
     │
 ┌───┴────┐
 │        │
 │ Cache  │
 │Existe? │
 │        │
 └───┬────┘
     │
Sim  ▼ Não
 Retorna      Consulta Supabase
                 │
                 ▼
          Salva no Redis
                 │
                 ▼
          Retorna resposta
```

---

# Regra Principal

O Redis nunca será considerado a fonte oficial dos dados.

Toda gravação deverá ocorrer primeiro no Supabase.

Somente após a confirmação da operação o cache poderá ser atualizado ou invalidado.

---

# Estratégia de Cache

Utilizar exclusivamente o padrão:

**Cache Aside**

Fluxo:

1. Consultar Redis.
2. Caso exista, retornar.
3. Caso não exista:
   - consultar Supabase;
   - salvar no Redis;
   - retornar ao usuário.

---

# Estratégia de Escrita

Sempre seguir esta ordem:

1. Gravar no Supabase.
2. Validar sucesso.
3. Invalidar cache correspondente.
4. Próxima consulta recria automaticamente o cache.

Nunca atualizar apenas o Redis.

---

# Estrutura das Chaves

Toda chave deverá possuir o Company ID.

Formato:

```
company:{companyId}:{modulo}:{identificador}
```

Exemplos:

```
company:1:settings

company:1:dashboard

company:1:categories

company:1:brands

company:1:products:list

company:1:inventory:alerts

company:1:financial:summary

company:1:reports:sales:month

user:55:permissions

user:55:profile
```

Nunca criar chaves globais.

Errado:

```
dashboard

products

settings
```

---

# TTL (Tempo de Vida)

## Dashboard

60 segundos

---

## Categorias

15 minutos

---

## Marcas

15 minutos

---

## Configurações

30 minutos

---

## Permissões

5 minutos

---

## Lista de Produtos

2 minutos

---

## Relatórios

10 minutos

---

## Produtos Mais Vendidos

5 minutos

---

## Alertas

30 segundos

---

## Empresa

30 minutos

---

# Dados que Devem Utilizar Cache

- Dashboard
- Categorias
- Marcas
- Configurações
- Empresa
- Produtos
- Permissões
- Relatórios consolidados
- KPIs
- Estatísticas
- Resumos financeiros
- Produtos mais vendidos

---

# Dados que Nunca Devem Ser Cache Primário

Sempre consultar diretamente o banco para operações críticas:

- Venda
- Cancelamento
- Caixa
- Financeiro
- Estoque durante movimentações
- Compras
- Recebimentos
- Pagamentos
- Auditoria
- Login
- Autenticação

---

# Organização

Criar:

```
src/lib/redis.ts

src/services/cache/

CacheService.ts

CacheKeys.ts

CacheTTL.ts
```

---

# CacheService

Responsável por:

- get()
- set()
- delete()
- exists()
- invalidate()
- invalidateByPattern()

Toda comunicação com Redis deverá passar por este serviço.

---

# CacheKeys

Centralizar todas as chaves.

Exemplo:

```
CACHE_KEYS.COMPANY

CACHE_KEYS.DASHBOARD

CACHE_KEYS.PRODUCTS

CACHE_KEYS.CATEGORIES

CACHE_KEYS.BRANDS

CACHE_KEYS.PERMISSIONS
```

Nunca escrever strings diretamente nos módulos.

---

# CacheTTL

Centralizar todos os tempos.

Exemplo:

```
SETTINGS = 1800

DASHBOARD = 60

PRODUCTS = 120

REPORTS = 600

PERMISSIONS = 300
```

---

# Invalidação

Sempre invalidar cache após:

## Produtos

- cadastro
- edição
- exclusão lógica

---

## Categorias

- cadastro
- edição
- exclusão

---

## Marcas

- cadastro
- edição
- exclusão

---

## Configurações

- alteração

---

## Empresa

- alteração

---

## Dashboard

Sempre após:

- venda
- compra
- pagamento
- recebimento
- movimentação financeira
- movimentação de estoque

---

# Fallback

Caso Redis esteja indisponível:

- ignorar cache;
- consultar Supabase;
- continuar funcionamento normalmente.

A aplicação nunca poderá parar por falha do Redis.

---

# Tratamento de Erros

Toda operação deverá possuir:

- try/catch
- timeout
- fallback
- log de erro

---

# Segurança

Nunca armazenar em cache:

- Tokens
- JWT
- Senhas
- OTP
- Dados bancários
- Cartões
- Informações sensíveis

---

# Multiempresa

Todo cache deverá ser isolado por Company ID.

Nunca compartilhar cache entre empresas.

---

# Performance Esperada

Objetivos:

- Dashboard < 300 ms
- Categorias < 100 ms
- Produtos < 200 ms
- Configurações < 100 ms
- Relatórios < 500 ms

---

# Monitoramento

Registrar:

- Cache Hit
- Cache Miss
- Tempo de resposta
- Tempo médio
- Erros
- Quantidade de invalidações

---

# Integração

Integrar cache com:

- Dashboard
- Produtos
- Categorias
- Marcas
- Financeiro
- Relatórios
- Empresa
- Configurações

---

# Regras Obrigatórias

- Nunca acessar Redis diretamente nos componentes React.
- Toda comunicação deverá passar pelo CacheService.
- Nunca confiar apenas no cache.
- Sempre validar os dados críticos no Supabase.
- Toda chave deverá possuir Company ID.
- Toda escrita deverá atualizar primeiro o Supabase.
- Toda alteração deverá invalidar o cache correspondente.
- O sistema deverá continuar funcionando mesmo sem Redis.

---

# Critérios de Aceite

Esta implementação será considerada concluída quando:

- Redis estiver integrado ao projeto.
- CacheService estiver funcionando.
- Chaves padronizadas estiverem implementadas.
- TTL centralizado.
- Fallback funcionando.
- Dashboard utilizando cache.
- Categorias utilizando cache.
- Produtos utilizando cache.
- Configurações utilizando cache.
- Relatórios utilizando cache.
- Nenhuma operação crítica depender exclusivamente do Redis.
- A aplicação permanecer funcional mesmo com indisponibilidade do cache.