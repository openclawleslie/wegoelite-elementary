import { NextRequest, NextResponse } from "next/server";
import {
  getSessions,
  createSession,
  getOrCreateTodaySession,
} from "@/lib/data/homework";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  const teacherId = req.nextUrl.searchParams.get("teacher_id");

  if (date && teacherId) {
    const result = await getOrCreateTodaySession(teacherId);
    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 },
      );
    }
    return NextResponse.json({ data: result.data });
  }

  const result = await getSessions({
    filters: date
      ? [{ field: "date", operator: "eq", value: date }]
      : undefined,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }
  return NextResponse.json({ data: result.data, count: result.count });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { teacher_id } = body;

  if (!teacher_id) {
    return NextResponse.json({ error: "缺少 teacher_id" }, { status: 400 });
  }

  const result = await getOrCreateTodaySession(teacher_id);
  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }
  return NextResponse.json({ data: result.data }, { status: 201 });
}
