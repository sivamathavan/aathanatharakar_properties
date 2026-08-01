import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Helper to decode JWT payload without verification (safe for client/middleware routing UX checks)
function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const tokenCookie = req.cookies.get("firebase_token")?.value;
  const decoded = tokenCookie ? parseJwt(tokenCookie) : null;
  
  const isAuth = !!decoded;
  const pathname = req.nextUrl.pathname;
  const isAdminLogin = pathname.startsWith("/admin/login");
  const isAdminRoute = pathname.startsWith("/admin");
  const isPublicLogin = pathname === "/login";
  const isRegister = pathname.startsWith("/register");
  const isDashboard = pathname.startsWith("/dashboard");
  const role = decoded?.role; // custom claim set via admin auth

  // ─── Broker-Only Mode: Redirect public auth routes ───────────────────────
  // /login → redirect to /admin/login (kept for admin access)
  if (isPublicLogin) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  // /register/* → redirect to homepage (feature paused)
  if (isRegister) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  // /dashboard/* → redirect to homepage (feature paused)
  if (isDashboard) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  // /services/* → redirect to homepage (feature paused/handled via WhatsApp directly)
  if (pathname.startsWith("/services")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // ─── Admin Login page: redirect already-authed admins to /admin ──────────
  if (isAdminLogin && isAuth && role === "ADMIN") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  // ─── Protect /admin/* routes ─────────────────────────────────────────────
  if (!isAuth && isAdminRoute && !isAdminLogin) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  if (isAuth && isAdminRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/login",
    "/admin/login",
    "/register/:path*",
    "/dashboard/:path*",
    "/services",
    "/services/:path*",
  ],
};
