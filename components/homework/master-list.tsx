"use client";

import { useState, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { HomeworkItem, HomeworkItemStatus } from "@/lib/types/homework";

interface MasterListProps {
  items: HomeworkItem[];
  onStatusChange: (itemId: string, newStatus: HomeworkItemStatus) => void;
}

const STATUS_CYCLE: HomeworkItemStatus[] = ["pending", "in_progress", "done"];

const CHIP_STYLES: Record<HomeworkItemStatus, string> = {
  pending: "bg-gray-100 text-gray-600 border-gray-200",
  in_progress: "bg-amber-100 text-amber-800 border-amber-300",
  done: "bg-green-100 text-green-700 border-green-300",
};

const TYPE_ICON: Record<string, string> = {
  test: "考",
  review: "複",
};

function chipLabel(item: HomeworkItem): string {
  const prefix = TYPE_ICON[item.item_type]
    ? `${TYPE_ICON[item.item_type]} `
    : "";
  const subj = item.subject;
  // Shorten description to fit chip
  const desc =
    item.description.length > 8
      ? item.description.slice(0, 8) + "..."
      : item.description;
  return `${prefix}${subj} ${desc}`;
}

function dueLabel(item: HomeworkItem): string | null {
  if (!item.due_date) return null;
  const today = new Date().toISOString().split("T")[0];
  if (item.due_date === today) return null; // due today, no label needed
  const due = new Date(item.due_date);
  return `${due.getMonth() + 1}/${due.getDate()}`;
}

export default function MasterList({ items, onStatusChange }: MasterListProps) {
  const [filter, setFilter] = useState("");

  // Group by student
  const students = useMemo(() => {
    const map = new Map<
      string,
      { name: string; grade: string; items: HomeworkItem[] }
    >();
    for (const item of items) {
      const sid = item.student_id;
      if (!map.has(sid)) {
        const name = item.student?.name ?? "未知";
        // Extract grade from student data if available, otherwise empty
        map.set(sid, { name, grade: "", items: [] });
      }
      map.get(sid)!.items.push(item);
    }
    // Sort by name
    return Array.from(map.entries()).sort((a, b) =>
      a[1].name.localeCompare(b[1].name, "zh-TW"),
    );
  }, [items]);

  const filtered = useMemo(() => {
    if (!filter) return students;
    return students.filter(
      ([, s]) =>
        s.name.includes(filter) ||
        s.items.some((i) => i.subject.includes(filter)),
    );
  }, [students, filter]);

  const summary = useMemo(() => {
    const done = items.filter((i) => i.status === "done").length;
    return { done, total: items.length };
  }, [items]);

  const handleTap = useCallback(
    (item: HomeworkItem) => {
      const idx = STATUS_CYCLE.indexOf(item.status);
      const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
      onStatusChange(item.id, next);
    },
    [onStatusChange],
  );

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3">
        <span className="text-sm font-medium text-blue-900">今日進度</span>
        <div className="flex items-center gap-3">
          <div className="h-2 w-32 rounded-full bg-blue-200 overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all"
              style={{
                width:
                  summary.total > 0
                    ? `${(summary.done / summary.total) * 100}%`
                    : "0%",
              }}
            />
          </div>
          <span className="text-sm font-bold text-blue-900">
            {summary.done}/{summary.total}
          </span>
        </div>
      </div>

      {/* Search */}
      <Input
        placeholder="搜尋學生或科目..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      {/* Student rows */}
      <div className="space-y-1">
        {filtered.map(([studentId, { name, items: studentItems }]) => {
          const done = studentItems.filter((i) => i.status === "done").length;
          const total = studentItems.length;
          const allDone = done === total;

          return (
            <div
              key={studentId}
              className={`rounded-lg border p-3 ${allDone ? "bg-green-50/50 border-green-200" : "bg-white border-gray-100"}`}
            >
              {/* Student header */}
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{name}</span>
                <span
                  className={`text-xs font-medium ${allDone ? "text-green-600" : "text-gray-500"}`}
                >
                  {done}/{total}
                </span>
              </div>

              {/* Homework chips */}
              <div className="flex flex-wrap gap-1.5">
                {studentItems.map((item) => {
                  const due = dueLabel(item);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTap(item)}
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-all active:scale-95 select-none ${CHIP_STYLES[item.status]}`}
                      title={`${item.subject} ${item.description}${item.due_date ? ` (${item.due_date})` : ""}`}
                    >
                      {chipLabel(item)}
                      {due && (
                        <span className="text-[10px] opacity-60">{due}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          {items.length === 0 ? "今天還沒有作業記錄" : "沒有符合的學生"}
        </div>
      )}
    </div>
  );
}
