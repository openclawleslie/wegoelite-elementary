import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/** GET /api/progress?date=YYYY-MM-DD — get progress items for a date (includes carried items) */
export async function GET(req: NextRequest) {
  const date =
    req.nextUrl.searchParams.get("date") ||
    new Date().toISOString().split("T")[0];

  const { data, error } = await (supabase.from("wg_progress_items") as any)
    .select("*, student:wg_students(id, name)")
    .eq("date", date)
    .order("student_id", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

/** POST /api/progress — bulk create progress items */
export async function POST(req: NextRequest) {
  const { items } = await req.json();

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "缺少項目" }, { status: 400 });
  }

  const { data, error } = await (supabase.from("wg_progress_items") as any)
    .insert(items)
    .select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

/** PATCH /api/progress?id=xxx — update a single item */
export async function PATCH(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

  const updates = await req.json();

  const { data, error } = await (supabase.from("wg_progress_items") as any)
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
