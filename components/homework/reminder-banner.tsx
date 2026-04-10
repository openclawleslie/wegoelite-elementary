"use client";

import { useState, useEffect } from "react";
import { HomeworkReminder } from "@/lib/types/homework";

export default function ReminderBanner() {
  const [reminders, setReminders] = useState<HomeworkReminder[]>([]);

  useEffect(() => {
    async function fetchReminders() {
      try {
        const res = await fetch("/api/homework/reminders");
        const json = await res.json();
        setReminders(json.data ?? []);
      } catch {
        // Non-critical
      }
    }
    fetchReminders();
  }, []);

  if (reminders.length === 0) return null;

  // Group by subject + description + due_date (same assignment across students)
  const grouped = new Map<
    string,
    {
      subject: string;
      description: string;
      due_date: string;
      days_until: number;
      urgency: HomeworkReminder["urgency"];
      count: number;
    }
  >();
  for (const r of reminders) {
    const key = `${r.subject}|${r.description}|${r.due_date}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        subject: r.subject,
        description: r.description,
        due_date: r.due_date,
        days_until: r.days_until,
        urgency: r.urgency,
        count: 0,
      });
    }
    grouped.get(key)!.count++;
  }

  const items = Array.from(grouped.values()).sort(
    (a, b) => a.days_until - b.days_until,
  );

  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
      <p className="text-xs font-medium text-orange-800 mb-2">即將到來</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => {
          const dayLabel =
            item.days_until === 0
              ? "今天"
              : item.days_until === 1
                ? "明天"
                : item.days_until === 2
                  ? "後天"
                  : `${item.days_until}天`;
          return (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-md bg-white border border-orange-200 px-2 py-1 text-xs text-orange-800"
            >
              <span className="font-medium">{item.subject}</span>
              <span className="truncate max-w-24">{item.description}</span>
              <span className="text-orange-500">{dayLabel}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
