import React from "react"

export function Footer() {
  return (
    <footer className="flex h-12 w-full items-center justify-between border-t border-border bg-card px-6 text-xs text-muted-foreground mt-auto">
      <div>
        <span>&copy; {new Date().getFullYear()} Adega Cloud. Todos os direitos reservados.</span>
      </div>
      <div className="flex items-center gap-4">
        <a href="#" className="hover:text-foreground transition-colors">Termos</a>
        <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
        <a href="#" className="hover:text-foreground transition-colors">Suporte</a>
      </div>
    </footer>
  )
}
