import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth(function proxy(req) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/manajemen-pengguna")) {
    return NextResponse.next();
  }

  // No session → redirect to login
  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Authenticated but not ADMIN → silent redirect to beranda
  if (req.auth.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/beranda", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/manajemen-pengguna/:path*"],
};
