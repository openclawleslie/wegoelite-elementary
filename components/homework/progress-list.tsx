"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle } from "lucide-react";

export type ProgressStatus =
  | "pending"
  | "needs_correction"
  | "done"
  | "carried";

export interface ProgressItem {
  id: string;
  student_id: string;
  date: string;
  subject: string;
  description: string;
  status: ProgressStatus;
  carried_from: string | null;
  student?: { id: string; name: string };
}

interface ProgressListProps {
  items: ProgressItem[];
  todayStudents: { id: string; name: string }[];
  date: string;
  onStatusToggle: (itemId: string, newStatus: ProgressStatus) => void;
  onSubmitDay: () => void;
  isSubmitting: boolean;
}

const STATUS_CYCLE: ProgressStatus[] = ["pending", "needs_correction", "done"];

const STATUS_STYLES: Record<ProgressStatus, string> = {
  pending: "bg-gray-100 text-gray-600 border-gray-200",
  needs_correction: "bg-amber-100 text-amber-800 border-amber-300",
  done: "bg-green-100 text-green-700 border-green-300",
  carried: "bg-orange-100 text-orange-700 border-orange-300",
};

const STATUS_ICON: Record<ProgressStatus, string> = {
  pending: "☐",
  needs_correction: "△",
  done: "✓",
  carried: "→",
};

export default function ProgressList({
  items,
  todayStudents,
  date,
  onStatusToggle,
  onSubmitDay,
  isSubmitting,
}: ProgressListProps) {
  const [filter, setFilter] = useState("");

  const students = useMemo(() => {
    const map = new Map<string, { name: string; items: ProgressItem[] }>();

    for (const s of todayStudents) {
      map.set(s.id, { name: s.name, items: [] });
    }

    for (const item of items) {
      const sid = item.student_id;
      if (!map.has(sid)) {
        map.set(sid, { name: item.student?.name ?? "未知", items: [] });
      }
      map.get(sid)!.items.push(item);
    }

    return Array.from(map.entries()).sort((a, b) =>
      a[1].name.localeCompare(b[1].name, "zh-TW"),
    );
  }, [items, todayStudents]);

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
    const needsCorrection = items.filter(
      (i) => i.status === "needs_correction",
    ).length;
    const carried = items.filter((i) => i.status === "carried").length;
    return {
      done,
      needsCorrection,
      carried,
      total: items.length,
      unfinished: items.length - done - carried,
    };
  }, [items]);

  const handleTap = useCallback(
    (item: ProgressItem) => {
      if (item.status === "carried") return;
      const idx = STATUS_CYCLE.indexOf(item.status);
      const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
      onStatusToggle(item.id, next);
    },
    [onStatusToggle],
  );

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center justify-between rounded-lg bg-purple-50 px-4 py-3">
        <span className="text-sm font-medium text-purple-900">
          進度 ({date})
        </span>
        <div className="flex items-center gap-3">
          <div className="h-2 w-32 rounded-full bg-purple-200 overflow-hidden">
            <div
              className="h-full bg-purple-600 rounded-full transition-all"
              style={{
                width:
                  summary.total > 0
                    ? `${(summary.done / summary.total) * 100}%`
                    : "0%",
              }}
            />
          </div>
          <span className="text-sm font-bold text-purple-900">
            {summary.done}/{summary.total}
          </span>
        </div>
      </div>

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
          const allDone = total > 0 && done === total;
          const noItems = total === 0;

          return (
            <div
              key={studentId}
              className={`rounded-lg border p-3 ${allDone ? "bg-green-50/50 border-green-200" : noItems ? "bg-gray-50 border-dashed border-gray-200" : "bg-white border-gray-100"}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-base">{name}</span>
                <div className="flex items-center gap-1.5">
                  {!allDone && total > 0 && (
                    <button
                      onClick={() => {
                        for (const item of studentItems) {
                          if (item.status === "pending")
                            onStatusToggle(item.id, "done");
                        }
                      }}
                      className="p-1.5 rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                      title="全部完成"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
                  <span
                    className={`text-xs font-medium ${allDone ? "text-green-600" : "text-gray-400"}`}
                  >
                    {total > 0 ? `${done}/${total}` : "—"}
                  </span>
                </div>
              </div>

              {noItems ? (
                <p className="text-xs text-gray-400">今天沒有指定進度</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {studentItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleTap(item)}
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-all active:scale-95 select-none ${STATUS_STYLES[item.status]}`}
                      title={item.description}
                      disabled={item.status === "carried"}
                    >
                      {STATUS_ICON[item.status]} {item.subject}{" "}
                      {item.description}
                      {item.carried_from && (
                        <span className="text-[10px] opacity-60">
                          ({item.carried_from.slice(5)}順延)
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          沒有符合的學生
        </div>
      )}

      {/* End of day submit */}
      {items.length > 0 && (
        <div className="pt-4 border-t">
          <div className="text-sm text-gray-500 mb-2">
            {summary.unfinished > 0
              ? `${summary.unfinished} 項未完成（${summary.needsCorrection > 0 ? `${summary.needsCorrection} 需訂正` : ""}${summary.needsCorrection > 0 && summary.unfinished - summary.done - summary.needsCorrection > 0 ? "、" : ""}${summary.unfinished - summary.needsCorrection > 0 ? `${summary.unfinished - summary.needsCorrection} 未開始` : ""}），將順延至下一個上課日`
              : "全部完成！"}
          </div>
          <Button
            onClick={onSubmitDay}
            disabled={isSubmitting}
            className={`w-full h-12 text-base ${summary.unfinished === 0 ? "bg-green-600 hover:bg-green-700" : "bg-orange-500 hover:bg-orange-600"}`}
          >
            {isSubmitting
              ? "提交中..."
              : summary.unfinished > 0
                ? `結束今日 (${summary.unfinished} 項順延)`
                : "結束今日 ✓"}
          </Button>
        </div>
      )}
    </div>
  );
}
