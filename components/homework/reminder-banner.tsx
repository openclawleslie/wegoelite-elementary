"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { HomeworkReminder } from "@/lib/types/homework";
import { AlertTriangle, Bell, Flame } from "lucide-react";

const URGENCY_CONFIG = {
  warning: {
    icon: Bell,
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-800",
    label: (days: number) => `還有 ${days} 天`,
  },
  urgent: {
    icon: AlertTriangle,
    bg: "bg-orange-50 border-orange-300",
    text: "text-orange-800",
    label: (days: number) => (days === 2 ? "後天" : "明天"),
  },
  critical: {
    icon: Flame,
    bg: "bg-red-50 border-red-300",
    text: "text-red-800",
    label: (days: number) => (days === 0 ? "今天!" : "明天!"),
  },
};

export default function ReminderBanner() {
  const [reminders, setReminders] = useState<HomeworkReminder[]>([]);

  useEffect(() => {
    async function fetchReminders() {
      try {
        const res = await fetch("/api/homework/reminders");
        const json = await res.json();
        setReminders(json.data ?? []);
      } catch {
        // Silently fail — reminders are non-critical
      }
    }
    fetchReminders();
  }, []);

  if (reminders.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">
        即將到來的考試與截止日
      </h3>
      {reminders.map((reminder) => {
        const config = URGENCY_CONFIG[reminder.urgency];
        const Icon = config.icon;

        return (
          <Card key={reminder.item_id} className={`p-3 border ${config.bg}`}>
            <div className="flex items-center gap-3">
              <Icon className={`h-5 w-5 shrink-0 ${config.text}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${config.text}`}>
                  {reminder.student_name} — {reminder.subject}{" "}
                  {reminder.description}
                </p>
              </div>
              <span className={`text-xs font-bold shrink-0 ${config.text}`}>
                {config.label(reminder.days_until)}
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
