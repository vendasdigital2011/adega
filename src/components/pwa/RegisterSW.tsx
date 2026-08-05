"use client"

import { useEffect } from "react"

export function RegisterSW() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("Service Worker registrado no escopo:", reg.scope)
          })
          .catch((err) => {
            console.error("Falha ao registrar Service Worker:", err)
          })
      })
    }
  }, [])

  return null
}
