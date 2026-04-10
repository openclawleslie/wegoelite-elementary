import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * POST /api/progress/submit
 * End-of-day submit: mark session as done, carry unfinished items to next available weekday
 * Body: { date: "YYYY-MM-DD" }
 */
export async function POST(req: NextRequest) {
  const { date } = await req.json();
  if (!date) return NextResponse.json({ error: "缺少 date" }, { status: 400 });

  try {
    // Get all pending items for this date
    const { data: pending, error: fetchErr } = await (
      supabase.from("wg_progress_items") as any
    )
      .select("*")
      .eq("date", date)
      .eq("status", "pending");

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    if (!pending || pending.length === 0) {
      return NextResponse.json({
        message: "全部完成，沒有需要順延的項目",
        carried: 0,
      });
    }

    // Calculate next available weekday
    const nextDay = getNextWeekday(date);

    // Mark pending items as "carried"
    const pendingIds = pending.map((p: any) => p.id);
    await (supabase.from("wg_progress_items") as any)
      .update({ status: "carried" })
      .in("id", pendingIds);

    // Create new items for next weekday with carried_from reference
    const carriedItems = pending.map((p: any) => ({
      student_id: p.student_id,
      date: nextDay,
      subject: p.subject,
      description: p.description,
      status: "pending",
      carried_from: date,
    }));

    const { error: insertErr } = await (
      supabase.from("wg_progress_items") as any
    ).insert(carriedItems);

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({
      message: `${pending.length} 項未完成，已順延至 ${nextDay}`,
      carried: pending.length,
      nextDay,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** Get next weekday (Mon-Fri) after a given date */
function getNextWeekday(dateStr: string): string {
  const d = new Date(dateStr);
  do {
    d.setDate(d.getDate() + 1);
  } while (d.getDay() === 0 || d.getDay() === 6); // skip Sat/Sun
  return d.toISOString().split("T")[0];
}
