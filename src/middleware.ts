import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // 1. Refresh Supabase session and get authenticated user
  const { supabaseResponse, user } = await updateSession(request)

  // 2. Check team member session cookie
  const teamSession = request.cookies.get("projtrack_team_session")?.value

  const isAuthenticated = Boolean(user || teamSession)

  // 3. Define public routes
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/public")

  // 4. Redirect unauthenticated users trying to access protected routes
  if (!isAuthenticated && !isPublicRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/login"
    const target = pathname + (search || "")
    if (target && target !== "/") {
      redirectUrl.searchParams.set("redirectTo", target)
    }

    const redirectResponse = NextResponse.redirect(redirectUrl)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }

  // 5. Redirect authenticated users away from login/signup to dashboard
  if (
    isAuthenticated &&
    (pathname.startsWith("/login") || pathname.startsWith("/signup"))
  ) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/dashboard"
    redirectUrl.search = ""

    const redirectResponse = NextResponse.redirect(redirectUrl)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Public static assets (.svg, .png, .jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
    "/(api|trpc)(.*)",
  ],
}
