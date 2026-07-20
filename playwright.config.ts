import { defineConfig, devices } from "@playwright/test"

// E2E roda contra o dev server real + o Supabase real de desenvolvimento
// (mesmo padrão dos testes de integração — não há ambiente local isolado
// neste projeto). Sequencial (não paralelo) pelo mesmo motivo dos testes de
// integração: as duas contas de teste compartilham estado (ex.: caixa).
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  // Next.js dev mode compila cada rota sob demanda na primeira visita — em
  // uma execução isolada (server recém-iniciado) isso pode passar de 30s
  // facilmente. Produção usaria `next start` (já buildado), então essa folga
  // é só para o modo de desenvolvimento usado aqui.
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    navigationTimeout: 45_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
