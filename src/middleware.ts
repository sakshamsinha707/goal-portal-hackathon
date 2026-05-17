import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { dashboardPath } from "@/lib/permissions";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const publicPaths = ["/login"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Always allow NextAuth routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Always allow static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Always allow login page
  if (pathname === "/login") {
    if (req.auth?.user) {
      return NextResponse.redirect(
        new URL(dashboardPath(req.auth.user.role), req.url)
      );
    }

    return NextResponse.next();
  }

  // Redirect unauthenticated users
  if (!req.auth?.user) {
    const loginUrl = new URL("/login", req.url);

    loginUrl.searchParams.set(
      "callbackUrl",
      pathname + req.nextUrl.search
    );

    return NextResponse.redirect(loginUrl);
  }

  // Root redirect
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(dashboardPath(req.auth.user.role), req.url)
    );
  }

  // Admin protection
  if (
    (pathname.startsWith("/admin") ||
      pathname.startsWith("/reports") ||
      pathname.startsWith("/audit")) &&
    req.auth.user.role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/employee", req.url));
  }

  // Manager protection
  if (
    pathname.startsWith("/manager") &&
    req.auth.user.role === "EMPLOYEE"
  ) {
    return NextResponse.redirect(new URL("/employee", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
