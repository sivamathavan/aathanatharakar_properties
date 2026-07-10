import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const isAuth = !!req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    const isAdminLogin = pathname.startsWith("/admin/login");
    const isAdminRoute = pathname.startsWith("/admin");
    const isPublicLogin = pathname === "/login";
    const isRegister = pathname.startsWith("/register");
    const isDashboard = pathname.startsWith("/dashboard");
    const role = req.nextauth.token?.role;

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
  },
  {
    callbacks: {
      authorized: () => true, // We handle all redirects manually above
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/login",
    "/admin/login",
    "/register/:path*",
    "/dashboard/:path*",
  ],
};
