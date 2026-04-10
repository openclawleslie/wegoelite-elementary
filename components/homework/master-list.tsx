"use client";

import { useState, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  HomeworkItem,
  HomeworkItemStatus,
  HomeworkItemType,
} from "@/lib/types/homework";

interface MasterListProps {
  items: HomeworkItem[];
  onStatusChange: (itemId: string, newStatus: HomeworkItemStatus) => void;
}

const STATUS_CYCLE: HomeworkItemStatus[] = ["pending", "in_progress", "done"];

const STATUS_STYLES: Record<HomeworkItemStatus, string> = {
  pending: "bg-gray-100 border-gray-200 text-gray-700",
  in_progress: "bg-yellow-50 border-yellow-300 text-yellow-800",
  done: "bg-green-50 border-green-300 text-green-800",
};

const STATUS_LABELS: Record<HomeworkItemStatus, string> = {
  pending: "未開始",
  in_progress: "進行中",
  done: "完成",
};

const TYPE_LABELS: Record<HomeworkItemType, string> = {
  homework: "作業",
  test: "考試",
  review: "複習",
};

export default function MasterList({ items, onStatusChange }: MasterListProps) {
  const [filterStudent, setFilterStudent] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterStatus, setFilterStatus] = useState<HomeworkItemStatus | "">("");

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterStudent && !item.student?.name?.includes(filterStudent))
        return false;
      if (filterSubject && !item.subject.includes(filterSubject)) return false;
      if (filterStatus && item.status !== filterStatus) return false;
      return true;
    });
  }, [items, filterStudent, filterSubject, filterStatus]);

  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; items: HomeworkItem[] }>();
    for (const item of filteredItems) {
      const studentId = item.student_id;
      const studentName = item.student?.name ?? "未知";
      if (!map.has(studentId)) {
        map.set(studentId, { name: studentName, items: [] });
      }
      map.get(studentId)!.items.push(item);
    }
    return Array.from(map.entries());
  }, [filteredItems]);

  const summary = useMemo(() => {
    const done = items.filter((i) => i.status === "done").length;
    return { done, total: items.length };
  }, [items]);

  const handleTap = useCallback(
    (item: HomeworkItem) => {
      const currentIndex = STATUS_CYCLE.indexOf(item.status);
      const nextStatus = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length];
      onStatusChange(item.id, nextStatus);
    },
    [onStatusChange],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg bg-primary/5 p-4">
        <span className="font-medium">今日進度</span>
        <span className="text-lg font-bold">
          {summary.done}/{summary.total} 完成
        </span>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="搜尋學生"
          value={filterStudent}
          onChange={(e) => setFilterStudent(e.target.value)}
          className="flex-1"
        />
        <Input
          placeholder="搜尋科目"
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="flex-1"
        />
        <select
          value={filterStatus}
          onChange={(e) =>
            setFilterStatus(e.target.value as HomeworkItemStatus | "")
          }
          className="rounded-md border px-3 py-2 text-sm bg-background"
        >
          <option value="">全部</option>
          <option value="pending">未開始</option>
          <option value="in_progress">進行中</option>
          <option value="done">完成</option>
        </select>
      </div>

      {grouped.map(([studentId, { name, items: studentItems }]) => (
        <div key={studentId} className="space-y-2">
          <h3 className="font-medium text-sm text-muted-foreground px-1">
            {name}
            <span className="ml-2">
              ({studentItems.filter((i) => i.status === "done").length}/
              {studentItems.length})
            </span>
          </h3>

          <div className="grid grid-cols-1 gap-2">
            {studentItems.map((item) => (
              <Card
                key={item.id}
                className={`p-3 cursor-pointer select-none transition-all active:scale-[0.98] border-2 ${STATUS_STYLES[item.status]}`}
                onClick={() => handleTap(item)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-black/5">
                        {TYPE_LABELS[item.item_type]}
                      </span>
                      <span className="font-medium text-sm">
                        {item.subject}
                      </span>
                      {item.due_date && (
                        <span className="text-xs text-muted-foreground">
                          {item.due_date}
                        </span>
                      )}
                    </div>
                    <p className="text-sm mt-1 truncate">{item.description}</p>
                  </div>

                  <span className="text-xs font-medium ml-3 shrink-0">
                    {STATUS_LABELS[item.status]}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {grouped.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          {items.length === 0 ? "今天還沒有作業記錄" : "沒有符合篩選條件的項目"}
        </div>
      )}
    </div>
  );
}
