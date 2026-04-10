"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { HomeworkItem } from "@/lib/types/homework";

const TYPE_LABELS: Record<string, string> = {
  homework: "作業",
  test: "考試",
  review: "複習",
};

const TYPE_COLORS: Record<string, string> = {
  homework: "bg-blue-100 text-blue-800",
  test: "bg-red-100 text-red-800",
  review: "bg-purple-100 text-purple-800",
};

export default function HomeworkCalendarPage() {
  const router = useRouter();
  const [items, setItems] = useState<HomeworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    async function fetchUpcoming() {
      try {
        const res = await fetch("/api/homework/items?upcoming=true");
        const json = await res.json();
        setItems(json.data ?? []);
      } finally {
        setLoading(false);
      }
    }
    fetchUpcoming();
  }, []);

  const itemsByDate = useMemo(() => {
    const map = new Map<string, HomeworkItem[]>();
    for (const item of items) {
      if (!item.due_date) continue;
      const date = item.due_date;
      if (!map.has(date)) map.set(date, []);
      map.get(date)!.push(item);
    }
    return map;
  }, [items]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: { date: string; day: number; isCurrentMonth: boolean }[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push({ date: "", day: 0, isCurrentMonth: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ date: dateStr, day: d, isCurrentMonth: true });
    }

    return days;
  }, [currentMonth]);

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-3 p-4 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/homework")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">行事曆</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setCurrentMonth(
                (m) => new Date(m.getFullYear(), m.getMonth() - 1, 1),
              )
            }
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="font-bold text-lg">
            {currentMonth.getFullYear()} 年 {currentMonth.getMonth() + 1} 月
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setCurrentMonth(
                (m) => new Date(m.getFullYear(), m.getMonth() + 1, 1),
              )
            }
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-7 text-center text-xs text-muted-foreground font-medium">
          {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
            <div key={d} className="p-2">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((cell, i) => {
            if (!cell.isCurrentMonth) {
              return <div key={i} className="h-20" />;
            }

            const dayItems = itemsByDate.get(cell.date) ?? [];
            const isToday = cell.date === today;

            return (
              <div
                key={i}
                className={`h-20 rounded-lg p-1 text-xs border ${
                  isToday ? "border-primary bg-primary/5" : "border-transparent"
                }`}
              >
                <span
                  className={`font-medium ${isToday ? "text-primary" : ""}`}
                >
                  {cell.day}
                </span>
                <div className="mt-0.5 space-y-0.5 overflow-hidden">
                  {dayItems.slice(0, 2).map((item) => (
                    <div
                      key={item.id}
                      className={`rounded px-1 py-0.5 truncate text-[10px] ${TYPE_COLORS[item.item_type] ?? "bg-gray-100"}`}
                    >
                      {item.student?.name?.charAt(0)} {item.subject}
                    </div>
                  ))}
                  {dayItems.length > 2 && (
                    <div className="text-[10px] text-muted-foreground">
                      +{dayItems.length - 2}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!loading && items.length > 0 && (
          <div className="space-y-2 pt-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              即將到來
            </h3>
            {items.slice(0, 20).map((item) => (
              <Card key={item.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[item.item_type]}`}
                    >
                      {TYPE_LABELS[item.item_type]}
                    </span>
                    <span className="text-sm font-medium ml-2">
                      {item.student?.name} — {item.subject}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {item.due_date}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {item.description}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
