import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

export default withAuth(
  function middleware(req) {
    const isAuth = !!req.nextauth.token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/admin/login") || req.nextUrl.pathname.startsWith("/register");
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
    const role = req.nextauth.token?.role;

    if (isAuthPage) {
      if (isAuth) {
        if (role === UserRole.ADMIN && req.nextUrl.pathname.startsWith("/admin/login")) {
          return NextResponse.redirect(new URL("/admin", req.url));
        } else if (role !== UserRole.ADMIN && req.nextUrl.pathname.startsWith("/login")) {
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }
      }
      return null;
    }

    if (!isAuth && isAdminRoute) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    if (isAuth && isAdminRoute && role !== UserRole.ADMIN) {
      return NextResponse.redirect(new URL("/login", req.url)); // or redirect to unauthorized
    }

    if (!isAuth && req.nextUrl.pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    
    if (!isAuth && req.nextUrl.pathname.startsWith("/sell-your-property")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true, // We handle redirects in the middleware function
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
    "/sell-your-property",
  ],
};
