export type UserRole = "admin" | "staff" | "teacher" | "parent";

export interface Student {
  id: string;
  name: string;
  grade: string;
  class: string;
  parent_name: string;
  parent_phone: string;
  parent_line_id: string;
  email: string;
  enrollment_date: string;
  status: "active" | "inactive";
  notes: string;
  department: string;
  created_at: string;
  updated_at: string;
}

export interface Teacher {
  id: string;
  name: string;
  phone: string;
  email: string;
  subjects: string[];
  status: "active" | "inactive";
  notes: string;
  created_at: string;
  updated_at: string;
}

export type {
  HomeworkSession,
  HomeworkItem,
  CaptureLog,
  ExtractionResult,
  ExtractionItem,
  HomeworkReminder,
  HomeworkItemType,
  HomeworkItemStatus,
  HomeworkItemSource,
  HomeworkConfidence,
  SessionStatus,
  ExtractionStatus,
} from "./types/homework";
