import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth-server";

const PUBLIC_PATHS = ["/login"];
const PUBLIC_API_PREFIXES = ["/api/auth/", "/api/cron/"];

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith("/_next/") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  const isApi = pathname.startsWith("/api/");

  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();
  if (isApi && PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
