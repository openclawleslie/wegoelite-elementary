import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Get day of week in Taipei timezone (1=Mon ... 5=Fri, 6=Sat, 0=Sun)
function getTaipeiDayOfWeek(): number {
  const now = new Date();
  const taipeiStr = now.toLocaleDateString("en-US", {
    timeZone: "Asia/Taipei",
    weekday: "short",
  });
  const map: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 0,
  };
  return map[taipeiStr] ?? 0;
}

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const allStudents = req.nextUrl.searchParams.get("all") === "true";

  let query = (supabase.from("wg_students") as any)
    .select("*")
    .eq("notes", "wego_elementary_afterschool")
    .order("name", { ascending: true });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter by today's schedule unless ?all=true
  if (!allStudents) {
    const today = getTaipeiDayOfWeek();
    const todayStr = String(today);
    const filtered = (data ?? []).filter((s: { class: string }) => {
      const schedule = s.class || "1,2,3,4,5";
      return schedule.split(",").includes(todayStr);
    });
    return NextResponse.json({ data: filtered });
  }

  return NextResponse.json({ data: data ?? [] });
}
