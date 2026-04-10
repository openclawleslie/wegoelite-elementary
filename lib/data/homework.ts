/**
 * Homework Data Access Layer
 *
 * Uses the generic CRUD factory for standard operations.
 * Custom queries for sessions, items, and capture logs.
 */

import { supabase } from "../supabase";
import { HomeworkSession, HomeworkItem, CaptureLog } from "../types/homework";
import { ListResult, DataResult } from "./types";
import { createCrud, toDataError } from "./crud-factory";

// --- Sessions ---

const sessionCrud = createCrud<HomeworkSession>({
  tableName: "wg_homework_sessions",
  entityLabel: "作業記錄",
  defaultSort: { field: "date", ascending: false },
});

export const getSessions = sessionCrud.getAll;
export const getSessionById = sessionCrud.getById;
export const createSession = sessionCrud.create;
export const updateSession = sessionCrud.update;
export const deleteSession = sessionCrud.remove;

// --- Items ---

const itemCrud = createCrud<HomeworkItem>({
  tableName: "wg_homework_items",
  entityLabel: "作業項目",
  defaultSort: [
    { field: "student_id", ascending: true },
    { field: "due_date", ascending: true },
  ],
});

export const getItems = itemCrud.getAll;
export const getItemById = itemCrud.getById;
export const createItem = itemCrud.create;
export const updateItem = itemCrud.update;
export const deleteItem = itemCrud.remove;

export async function getItemsBySessionId(
  sessionId: string,
): Promise<ListResult<HomeworkItem>> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error, count } = await (
      supabase.from("wg_homework_items") as any
    )
      .select("*, student:wg_students(id, name)", { count: "exact" })
      .eq("session_id", sessionId)
      .order("student_id", { ascending: true });

    if (error)
      return { data: [], error: toDataError(error, "作業項目"), count: 0 };
    return {
      data: (data as HomeworkItem[]) ?? [],
      error: null,
      count: count ?? undefined,
    };
  } catch (error) {
    return { data: [], error: toDataError(error, "作業項目"), count: 0 };
  }
}

export async function getItemsByStudentId(
  studentId: string,
): Promise<ListResult<HomeworkItem>> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error, count } = await (
      supabase.from("wg_homework_items") as any
    )
      .select("*", { count: "exact" })
      .eq("student_id", studentId)
      .order("due_date", { ascending: true });

    if (error)
      return { data: [], error: toDataError(error, "作業項目"), count: 0 };
    return {
      data: (data as HomeworkItem[]) ?? [],
      error: null,
      count: count ?? undefined,
    };
  } catch (error) {
    return { data: [], error: toDataError(error, "作業項目"), count: 0 };
  }
}

export async function getUpcomingDeadlines(
  limit = 50,
): Promise<ListResult<HomeworkItem>> {
  try {
    const today = new Date().toISOString().split("T")[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("wg_homework_items") as any)
      .select("*, student:wg_students(id, name)")
      .gt("due_date", today)
      .neq("status", "done")
      .not("due_date", "is", null)
      .order("due_date", { ascending: true })
      .limit(limit);

    if (error)
      return { data: [], error: toDataError(error, "作業項目"), count: 0 };
    return { data: (data as HomeworkItem[]) ?? [], error: null };
  } catch (error) {
    return { data: [], error: toDataError(error, "作業項目"), count: 0 };
  }
}

export async function bulkCreateItems(
  items: Omit<HomeworkItem, "id" | "created_at" | "updated_at" | "student">[],
): Promise<ListResult<HomeworkItem>> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("wg_homework_items") as any)
      .insert(items)
      .select("*");

    if (error)
      return { data: [], error: toDataError(error, "作業項目"), count: 0 };
    return {
      data: (data as HomeworkItem[]) ?? [],
      error: null,
      count: data?.length,
    };
  } catch (error) {
    return { data: [], error: toDataError(error, "作業項目"), count: 0 };
  }
}

export async function updateItemStatus(
  id: string,
  status: "pending" | "in_progress" | "done",
): Promise<DataResult<HomeworkItem>> {
  return updateItem(id, {
    status,
    updated_at: new Date().toISOString(),
  } as any);
}

// --- Capture Logs ---

const captureCrud = createCrud<CaptureLog>({
  tableName: "wg_capture_logs",
  entityLabel: "拍照記錄",
  defaultSort: { field: "captured_at", ascending: false },
});

export const getCaptureLogs = captureCrud.getAll;
export const getCaptureLogById = captureCrud.getById;
export const createCaptureLog = captureCrud.create;
export const updateCaptureLog = captureCrud.update;

export async function getOrCreateTodaySession(
  teacherId: string,
): Promise<DataResult<HomeworkSession>> {
  try {
    const today = new Date().toISOString().split("T")[0];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing, error: findError } = await (
      supabase.from("wg_homework_sessions") as any
    )
      .select("*")
      .eq("date", today)
      .eq("teacher_id", teacherId)
      .single();

    if (existing && !findError) {
      return { data: existing as HomeworkSession, error: null };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("wg_homework_sessions") as any)
      .insert({ date: today, teacher_id: teacherId })
      .select("*")
      .single();

    if (error) return { data: null, error: toDataError(error, "作業記錄") };
    return { data: data as HomeworkSession, error: null };
  } catch (error) {
    return { data: null, error: toDataError(error, "作業記錄") };
  }
}
