interface ReminderInput {
  id: string;
  due_date: string;
  student_name: string;
  subject: string;
  description: string;
  reminder_sent_1d: boolean;
  reminder_sent_2d: boolean;
  reminder_sent_5d: boolean;
}

interface ReminderOutput {
  item_id: string;
  student_name: string;
  subject: string;
  description: string;
  due_date: string;
  days_until: number;
  urgency: "warning" | "urgent" | "critical";
  message: string;
  flag_field: "reminder_sent_5d" | "reminder_sent_2d" | "reminder_sent_1d";
}

export function computeReminders(
  items: ReminderInput[],
  today: Date,
): ReminderOutput[] {
  const todayMs = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime();
  const results: ReminderOutput[] = [];

  for (const item of items) {
    const dueMs = new Date(item.due_date).getTime();
    const daysUntil = Math.floor((dueMs - todayMs) / (1000 * 60 * 60 * 24));

    if (daysUntil <= 0 || daysUntil > 5) continue;

    if (daysUntil === 1 && !item.reminder_sent_1d) {
      results.push({
        item_id: item.id,
        student_name: item.student_name,
        subject: item.subject,
        description: item.description,
        due_date: item.due_date,
        days_until: daysUntil,
        urgency: "critical",
        message: `明天${item.student_name}有${item.subject}${item.description}，今天需要準備！`,
        flag_field: "reminder_sent_1d",
      });
    } else if (daysUntil === 2 && !item.reminder_sent_2d) {
      results.push({
        item_id: item.id,
        student_name: item.student_name,
        subject: item.subject,
        description: item.description,
        due_date: item.due_date,
        days_until: daysUntil,
        urgency: "urgent",
        message: `${item.student_name}的${item.subject}${item.description}後天就到了！`,
        flag_field: "reminder_sent_2d",
      });
    } else if (daysUntil === 5 && !item.reminder_sent_5d) {
      results.push({
        item_id: item.id,
        student_name: item.student_name,
        subject: item.subject,
        description: item.description,
        due_date: item.due_date,
        days_until: daysUntil,
        urgency: "warning",
        message: `${item.student_name}的${item.subject}${item.description}還有 ${daysUntil} 天`,
        flag_field: "reminder_sent_5d",
      });
    }
  }

  return results.sort((a, b) => a.days_until - b.days_until);
}
