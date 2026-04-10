import { NextRequest, NextResponse } from "next/server";
import { getSessions, getOrCreateTodaySession } from "@/lib/data/homework";
import { getDefaultTeacherId } from "@/lib/default-teacher";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");

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

export async function POST(_req: NextRequest) {
  try {
    const teacherId = await getDefaultTeacherId();
    const result = await getOrCreateTodaySession(teacherId);
    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 },
      );
    }
    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
