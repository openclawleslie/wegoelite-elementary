import { supabase } from "./supabase";

const TEACHER_NAME = "薇閣國小老師";

let cachedTeacherId: string | null = null;

/**
 * Get or create the default teacher for the elementary app.
 * Returns the teacher UUID. Caches in memory after first call.
 */
export async function getDefaultTeacherId(): Promise<string> {
  if (cachedTeacherId) return cachedTeacherId;

  // Try to find existing teacher
  const { data: existing } = await (supabase.from("wg_teachers") as any)
    .select("id")
    .eq("name", TEACHER_NAME)
    .single();

  if (existing?.id) {
    cachedTeacherId = existing.id;
    return existing.id;
  }

  // Create the teacher
  const { data: created, error } = await (supabase.from("wg_teachers") as any)
    .insert({
      name: TEACHER_NAME,
      phone: "",
      email: "",
      subjects: [],
      status: "active",
      notes: "小學部門預設老師",
    })
    .select("id")
    .single();

  if (error) throw new Error(`無法建立老師: ${error.message}`);

  cachedTeacherId = created.id;
  return created.id;
}
