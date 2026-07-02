import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Define public paths
  const isPublicPath =
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password"

  // Check for the presence of the Supabase auth cookie.
  // Supabase Auth stores cookie keys starting with 'sb-'
  const cookies = request.cookies.getAll()
  const hasAuthCookie = cookies.some((cookie) => cookie.name.startsWith("sb-"))

  // For testing in development without cookies, if NEXT_PUBLIC_BYPASS_MIDDLEWARE is true, bypass it
  const bypassMiddleware = process.env.NEXT_PUBLIC_BYPASS_MIDDLEWARE === "true"

  if (bypassMiddleware) {
    return NextResponse.next()
  }

  // If path is protected and user has no session, redirect to /login
  if (!isPublicPath && !hasAuthCookie) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  // If user is logged in and trying to access login, redirect to dashboard
  if (isPublicPath && hasAuthCookie) {
    const dashboardUrl = new URL("/dashboard", request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
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
