import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!payload) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, role: payload.role });
}
