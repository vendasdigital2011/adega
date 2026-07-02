import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Define public paths
  const isPublicPath =
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password"

  // For testing in development without a real session, if NEXT_PUBLIC_BYPASS_MIDDLEWARE is true, bypass it
  const bypassMiddleware = process.env.NEXT_PUBLIC_BYPASS_MIDDLEWARE === "true"

  if (bypassMiddleware) {
    return NextResponse.next()
  }

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
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  // If user is logged in and trying to access login, redirect to dashboard
  if (isPublicPath && user) {
    const dashboardUrl = new URL("/dashboard", request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return response
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
