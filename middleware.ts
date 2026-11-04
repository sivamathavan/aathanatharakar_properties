import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Fast redirect for signed-out visitors. This only checks that a session cookie
// exists; the admin and dashboard layouts verify it and the role on the server.
export function middleware(req: NextRequest) {
  const hasSession = !!req.cookies.get("session")?.value;
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login") && !hasSession) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  if (pathname.startsWith("/dashboard") && !hasSession) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    // Keeps the Android app's mark, so the site still knows it is inside the app.
    const app = req.nextUrl.searchParams.get("app");
    if (app) url.searchParams.set("app", app);
    return NextResponse.redirect(url);
  }
  // Old feature pages that no longer exist.
  if (pathname.startsWith("/services") || pathname.startsWith("/register/")) {
    return NextResponse.redirect(new URL(pathname.startsWith("/register/") ? "/register" : "/", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/services/:path*", "/services", "/register/:path+"],
};
