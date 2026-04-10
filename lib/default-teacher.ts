// 薇閣國小老師 — hardcoded from wg_teachers table
const TEACHER_ID = "c37a9e0a-bc2b-433e-bcfd-d824f33f8095";

export async function getDefaultTeacherId(): Promise<string> {
  return TEACHER_ID;
}
