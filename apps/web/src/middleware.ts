import { NextRequest, NextResponse } from "next/server";

const ROLE_PREFIXES: Record<string, string> = {
  "/passenger": "PASSENGER",
  "/driver": "DRIVER",
  "/admin": "ADMIN",
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const prefix = Object.keys(ROLE_PREFIXES).find((p) => pathname.startsWith(p));
  if (!prefix) return NextResponse.next();

  const role = req.cookies.get("role")?.value;
  if (!role) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (role !== ROLE_PREFIXES[prefix]) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/passenger/:path*", "/driver/:path*", "/admin/:path*"],
};
