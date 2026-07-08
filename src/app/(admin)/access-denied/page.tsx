import { ShieldAlert } from "lucide-react"

export default function AccessDeniedPage() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive mb-4">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold">Acesso Negado</h1>
      <p className="text-muted-foreground mt-2 max-w-sm">
        Você não possui permissão para acessar esta área. Entre em contato com um administrador
        caso acredite que isso seja um engano.
      </p>
    </div>
  )
}
