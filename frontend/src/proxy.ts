import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/my-issues",
  "/onboarding",
  "/create-workspace",
];
const AUTH_ROUTES = ["/login", "/register"];

function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

/**
 * Next.js 16 Proxy (formerly middleware.ts)
 * Performs optimistic cookie-based routing checks before pages render.
 * Cryptographic JWT verification and token rotation remain enforced by the Express backend.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get("access_token")?.value;
  const hasSession = request.cookies.get("has_session")?.value === "1";

  const isProtectedRoute = matchesRoute(pathname, PROTECTED_ROUTES);
  const isAuthRoute = matchesRoute(pathname, AUTH_ROUTES);

  // Redirect unauthenticated users away from protected routes when no session exists
  if (isProtectedRoute && !accessToken && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect clearly authenticated users away from /login and /register
  if (isAuthRoute && accessToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
