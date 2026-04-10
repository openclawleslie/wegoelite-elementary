import { NextRequest, NextResponse } from "next/server";
import { getUpcomingDeadlines } from "@/lib/data/homework";
import { HomeworkReminder } from "@/lib/types/homework";

export async function GET(_req: NextRequest) {
  const result = await getUpcomingDeadlines();
  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reminders: HomeworkReminder[] = result.data
    .filter((item) => item.due_date)
    .map((item) => {
      const dueDate = new Date(item.due_date!);
      dueDate.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil(
        (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      let urgency: HomeworkReminder["urgency"] = "warning";
      if (daysUntil <= 1) urgency = "critical";
      else if (daysUntil <= 2) urgency = "urgent";

      return {
        item_id: item.id,
        student_name: item.student?.name ?? "未知",
        subject: item.subject,
        description: item.description,
        due_date: item.due_date!,
        days_until: daysUntil,
        urgency,
      };
    })
    .filter((r) => r.days_until <= 5 && r.days_until >= 0)
    .sort((a, b) => a.days_until - b.days_until);

  return NextResponse.json({ data: reminders });
}
