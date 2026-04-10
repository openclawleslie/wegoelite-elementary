import { NextRequest, NextResponse } from "next/server";
import {
  getItemsBySessionId,
  bulkCreateItems,
  getUpcomingDeadlines,
} from "@/lib/data/homework";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  const upcoming = req.nextUrl.searchParams.get("upcoming");

  if (upcoming === "true") {
    const result = await getUpcomingDeadlines();
    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 },
      );
    }
    return NextResponse.json({ data: result.data });
  }

  if (!sessionId) {
    return NextResponse.json({ error: "缺少 session_id" }, { status: 400 });
  }

  const result = await getItemsBySessionId(sessionId);
  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }
  return NextResponse.json({ data: result.data, count: result.count });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { items } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "缺少項目資料" }, { status: 400 });
  }

  const result = await bulkCreateItems(items);
  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }
  return NextResponse.json(
    { data: result.data, count: result.count },
    { status: 201 },
  );
}
