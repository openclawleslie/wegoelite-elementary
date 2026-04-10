export type HomeworkItemType = "homework" | "test" | "review";
export type HomeworkItemStatus = "pending" | "in_progress" | "done";
export type HomeworkItemSource = "extracted" | "manual";
export type HomeworkConfidence = "high" | "low";
export type SessionStatus = "in_progress" | "completed";
export type ExtractionStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export interface HomeworkSession {
  id: string;
  date: string;
  teacher_id: string;
  student_count: number;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
}

export interface HomeworkItem {
  id: string;
  session_id: string;
  student_id: string;
  item_type: HomeworkItemType;
  subject: string;
  description: string;
  due_date: string | null;
  status: HomeworkItemStatus;
  source: HomeworkItemSource;
  confidence: HomeworkConfidence;
  reminder_sent_5d: boolean;
  reminder_sent_2d: boolean;
  reminder_sent_1d: boolean;
  created_at: string;
  updated_at: string;
  // joined
  student?: { id: string; name: string };
}

export interface CaptureLog {
  id: string;
  student_id: string;
  session_id: string;
  photo_url: string | null;
  captured_at: string;
  quality_passed: boolean;
  extraction_status: ExtractionStatus;
  extraction_data: ExtractionResult | null;
  created_at: string;
}

/** Shape returned by Claude Vision extraction */
export interface ExtractionResult {
  student_name: string;
  date_captured: string;
  items: ExtractionItem[];
}

export interface ExtractionItem {
  type: HomeworkItemType;
  subject: string;
  description: string;
  due_date: string | null;
  confidence: HomeworkConfidence;
}

/** Reminder for the dashboard */
export interface HomeworkReminder {
  item_id: string;
  student_name: string;
  subject: string;
  description: string;
  due_date: string;
  days_until: number;
  urgency: "warning" | "urgent" | "critical";
}
