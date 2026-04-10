import { NextResponse } from "next/server";

export function verifyCronAuth(req: Request): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }
  const authHeader = req.headers.get("authorization");
  const providedSecret = authHeader?.replace("Bearer ", "");
  if (!providedSecret || providedSecret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
