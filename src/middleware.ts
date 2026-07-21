import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { logServer, generateRequestId } from "@/lib/logger"

// Maps protected routes to the permission required to access them.
// Routes not listed here only require authentication (no granular permission yet).
const routePermissions: Record<string, string> = {
  "/users/roles": "roles.manage",
  "/users": "users.view",
}

function permissionForPath(pathname: string): string | null {
  const match = Object.keys(routePermissions).find(
    (route) => pathname === route || pathname.startsWith(route + "/")
  )
  return match ? routePermissions[match] : null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requestId = generateRequestId()
  const startedAt = Date.now()

  // Define public paths
  const isPublicPath =
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password"

  // For testing in development without a real session, if NEXT_PUBLIC_BYPASS_MIDDLEWARE is true, bypass it.
  // Travado por process.env.NODE_ENV: mesmo que a env var vaze para produção
  // por engano, o bypass nunca é aplicado fora de desenvolvimento.
  const bypassMiddleware =
    process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_BYPASS_MIDDLEWARE === "true"

  if (bypassMiddleware) {
    return NextResponse.next()
  }

  try {
    let response = NextResponse.next({ request })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Validates the session against Supabase (also refreshes the token when needed)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // If path is protected and user has no valid session, redirect to /login
    if (!isPublicPath && !user) {
      logServer("info", "Redirecionado para login: sem sessão válida", {
        requestId,
        route: pathname,
        action: "middleware.redirect_unauthenticated",
        durationMs: Date.now() - startedAt,
      })
      const loginUrl = new URL("/login", request.url)
      return NextResponse.redirect(loginUrl)
    }

    // If user is logged in and trying to access login, redirect to dashboard
    if (isPublicPath && user) {
      const dashboardUrl = new URL("/dashboard", request.url)
      return NextResponse.redirect(dashboardUrl)
    }

    // Validate granular permission for routes that require one
    const requiredPermission = permissionForPath(pathname)
    if (user && requiredPermission) {
      const { data: hasPermission } = await supabase.rpc("user_has_permission", {
        perm_name: requiredPermission,
      })

      if (!hasPermission) {
        logServer("warn", "Acesso negado: usuário sem a permissão exigida pela rota", {
          requestId,
          route: pathname,
          userId: user.id,
          action: "middleware.permission_denied",
          eventName: requiredPermission,
          durationMs: Date.now() - startedAt,
        })
        const accessDeniedUrl = new URL("/access-denied", request.url)
        return NextResponse.redirect(accessDeniedUrl)
      }
    }

    response.headers.set("x-request-id", requestId)
    return response
  } catch (error) {
    // Falha ao validar sessão/permissão é uma falha técnica real (rede,
    // Supabase fora do ar) — nunca deve passar em silêncio. Modo seguro:
    // trata como não-autenticado (nunca deixa passar sem verificar).
    logServer("error", "Falha ao processar middleware de autenticação", {
      requestId,
      route: pathname,
      action: "middleware.unhandled_error",
      errorCode: (error as { code?: string })?.code,
      durationMs: Date.now() - startedAt,
    })
    if (isPublicPath) return NextResponse.next()
    return NextResponse.redirect(new URL("/login", request.url))
  }
}

// Configure paths that will trigger this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
