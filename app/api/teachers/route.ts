import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { data, error } = await (supabase.from("wg_teachers") as any)
    .select("*")
    .eq("status", "active")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}
