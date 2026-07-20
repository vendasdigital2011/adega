import "@testing-library/jest-dom/vitest"
import { readFileSync, existsSync } from "fs"
import path from "path"

// Vitest não carrega .env.local automaticamente como o Next.js faz — os
// testes de integração precisam da mesma URL/anon key que o app usa em
// desenvolvimento (não há Supabase local neste projeto).
const envPath = path.resolve(__dirname, "../.env.local")
if (existsSync(envPath)) {
  const envText = readFileSync(envPath, "utf8")
  for (const line of envText.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim()
    }
  }
}
