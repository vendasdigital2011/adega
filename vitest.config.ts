import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.test.{ts,tsx}", "tests/integration/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**", "node_modules/**"],
    testTimeout: 20000,
    // O padrão de hookTimeout é 10s, e não acompanha o testTimeout acima. Os
    // beforeAll dos testes de integração fazem várias chamadas em série ao
    // Supabase remoto (login + criar produto + estoque + cliente + abrir caixa),
    // o que estoura 10s com facilidade. Quando o hook estoura, as variáveis que
    // ele deveria preencher ficam undefined e o afterAll falha em cascata com um
    // PGRST202 enganoso (parâmetro sumido do corpo da RPC) — sintoma, não causa.
    hookTimeout: 30000,
    // Os testes de integração batem no mesmo Supabase de desenvolvimento
    // compartilhado (uma empresa, duas contas de teste) e mexem em recursos
    // exclusivos por usuário (ex.: só pode existir um caixa aberto por vez) —
    // rodar arquivos em paralelo causaria condições de corrida entre eles.
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      // Cobertura mede a camada de lógica de negócio (services, utils, schemas,
      // hooks) — não JSX de apresentação puro (páginas/layout/primitivas de UI),
      // que é validado via teste manual em navegador a cada sprint (padrão já
      // usado no projeto inteiro) e via os testes E2E do Playwright.
      include: [
        "src/services/**/*.ts",
        "src/utils/**/*.ts",
        "src/lib/**/*.ts",
        "src/features/**/schemas/**/*.ts",
        "src/features/**/utils.ts",
        "src/features/**/hooks/**/*.ts",
        "src/hooks/**/*.ts",
      ],
      exclude: [
        "**/*.d.ts",
        "src/lib/supabase-admin.ts",
        "src/lib/supabase.ts",
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 70,
      },
    },
  },
})
