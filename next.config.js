// Auditoria "reviravolta" — Etapa 5 (achado P7): next.config.js não tinha
// nenhum header de segurança. next/font/google (Inter, ver app/layout.tsx)
// já baixa e serve a fonte pela própria origem em build — não precisa de
// font-src externo. Sem <script> de terceiros nem analytics hoje.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), unload=*",
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
]

// CSP só em produção: o dev server (HMR/Fast Refresh) usa eval e um socket
// ws://localhost que uma CSP estrita quebraria — não vale o risco de
// atrapalhar o ambiente de desenvolvimento por um header que só protege de
// verdade o app já publicado.
const productionOnlyHeaders =
  process.env.NODE_ENV === "production"
    ? [
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel.live https://*.vercel.com",
            "style-src 'self' 'unsafe-inline' https://vercel.live https://fonts.googleapis.com",
            "img-src 'self' data: blob: https:",
            "font-src 'self' data: https://fonts.gstatic.com https://vercel.live https://*.vercel.live https://*.vercel.com",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.upstash.io wss://*.upstash.io https://api.openai.com https://generativelanguage.googleapis.com https://vercel.live https://*.vercel.live https://*.vercel.com",
            "frame-src 'self' https://vercel.live https://*.vercel.live https://*.vercel.com",
            "frame-ancestors 'self' https://vercel.live https://*.vercel.live https://*.vercel.com",
            "base-uri 'self'",
            "form-action 'self'",
          ].join("; "),
        },
      ]
    : []

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...securityHeaders, ...productionOnlyHeaders],
      },
    ]
  },
}

module.exports = nextConfig
