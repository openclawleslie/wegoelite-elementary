import { NextRequest, NextResponse } from "next/server";
import {
  signToken,
  COOKIE_NAME,
  COOKIE_OPTIONS,
  TOKEN_MAX_AGE,
} from "@/lib/auth-server";

const ADMIN_PASSWORD = "Worksmart333!";

export async function POST(req: NextRequest) {
  try {
    const { password } = (await req.json()) as { password: string };

    if (!password) {
      return NextResponse.json({ error: "Missing password" }, { status: 400 });
    }

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "密碼錯誤" }, { status: 401 });
    }

    const token = await signToken({
      role: "admin",
      iat: Math.floor(Date.now() / 1000),
    });

    const response = NextResponse.json({ success: true, role: "admin" });
    response.cookies.set(COOKIE_NAME, token, {
      ...COOKIE_OPTIONS,
      maxAge: TOKEN_MAX_AGE,
    });

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
