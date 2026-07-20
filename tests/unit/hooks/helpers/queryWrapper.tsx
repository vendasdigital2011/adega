import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// Wrapper para renderHook: QueryClient sem retry (falhas de mock não devem
// ficar tentando de novo) e sem cache entre testes.
export function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
  return { Wrapper, queryClient }
}
