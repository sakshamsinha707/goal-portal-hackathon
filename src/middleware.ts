import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { dashboardPath } from "@/lib/permissions";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const publicPaths = ["/login"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));
  const isApiAuth = pathname.startsWith("/api/auth");
  const isStatic =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".ico");

  if (isApiAuth || isStatic) return NextResponse.next();

  if (!req.auth?.user) {
    if (isPublic) return NextResponse.next();
    const login = new URL("/login", req.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  if (pathname === "/login") {
    return NextResponse.redirect(
      new URL(dashboardPath(req.auth.user.role), req.url)
    );
  }

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(dashboardPath(req.auth.user.role), req.url)
    );
  }

  if (
    (pathname.startsWith("/admin") ||
      pathname.startsWith("/reports") ||
      pathname.startsWith("/audit")) &&
    req.auth.user.role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/employee", req.url));
  }

  if (pathname.startsWith("/manager") && req.auth.user.role === "EMPLOYEE") {
    return NextResponse.redirect(new URL("/employee", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
