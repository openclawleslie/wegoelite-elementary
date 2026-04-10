"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Camera, Pencil, Plus, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  HomeworkItem,
  HomeworkItemStatus,
  HomeworkItemType,
} from "@/lib/types/homework";

interface MasterListProps {
  items: HomeworkItem[];
  todayStudents: { id: string; name: string }[];
  sessionId: string | null;
  onStatusChange: (itemId: string, newStatus: HomeworkItemStatus) => void;
  onItemsChanged: () => void;
}

const STATUS_CYCLE: HomeworkItemStatus[] = ["pending", "in_progress", "done"];

const CHIP_STYLES: Record<HomeworkItemStatus, string> = {
  pending: "bg-gray-100 text-gray-600 border-gray-200",
  in_progress: "bg-amber-100 text-amber-800 border-amber-300",
  done: "bg-green-100 text-green-700 border-green-300",
};

const TYPE_ICON: Record<string, string> = { test: "考", review: "複" };

function chipLabel(item: HomeworkItem): string {
  const prefix = TYPE_ICON[item.item_type]
    ? `${TYPE_ICON[item.item_type]} `
    : "";
  const desc =
    item.description.length > 8
      ? item.description.slice(0, 8) + "..."
      : item.description;
  return `${prefix}${item.subject} ${desc}`;
}

function dueLabel(item: HomeworkItem): string | null {
  if (!item.due_date) return null;
  const today = new Date().toISOString().split("T")[0];
  if (item.due_date === today) return null;
  const due = new Date(item.due_date);
  return `${due.getMonth() + 1}/${due.getDate()}`;
}

// Inline edit modal for a student's homework
function EditPanel({
  studentId,
  studentName,
  items,
  sessionId,
  onClose,
  onSaved,
}: {
  studentId: string;
  studentName: string;
  items: HomeworkItem[];
  sessionId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [editItems, setEditItems] = useState(
    items.map((i) => ({ ...i, _deleted: false })),
  );
  const [newItems, setNewItems] = useState<
    {
      subject: string;
      description: string;
      due_date: string;
      item_type: HomeworkItemType;
    }[]
  >([]);
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  async function handleSave() {
    setSaving(true);
    try {
      // Delete removed items
      for (const item of editItems.filter((i) => i._deleted)) {
        await fetch(`/api/homework/items/${item.id}`, { method: "DELETE" });
      }
      // Update edited items
      for (const item of editItems.filter((i) => !i._deleted)) {
        await fetch(`/api/homework/items/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: item.subject,
            description: item.description,
            due_date: item.due_date,
            item_type: item.item_type,
          }),
        });
      }
      // Create new items
      if (newItems.length > 0 && sessionId) {
        await fetch("/api/homework/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: newItems.map((n) => ({
              session_id: sessionId,
              student_id: studentId,
              item_type: n.item_type,
              subject: n.subject,
              description: n.description,
              due_date: n.due_date || today,
              status: "pending",
              source: "manual",
              confidence: "high",
              reminder_sent_5d: false,
              reminder_sent_2d: false,
              reminder_sent_1d: false,
            })),
          }),
        });
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg">{studentName} 作業編輯</h3>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Existing items */}
        <div className="space-y-2 mb-3">
          {editItems.map((item, idx) => (
            <div
              key={item.id}
              className={`flex gap-2 items-start ${item._deleted ? "opacity-30" : ""}`}
            >
              <div className="flex-1 space-y-1">
                <div className="flex gap-1">
                  <select
                    value={item.item_type}
                    onChange={(e) => {
                      const next = [...editItems];
                      next[idx] = {
                        ...next[idx],
                        item_type: e.target.value as HomeworkItemType,
                      };
                      setEditItems(next);
                    }}
                    className="border rounded px-2 py-1 text-xs w-16"
                    disabled={item._deleted}
                  >
                    <option value="homework">作業</option>
                    <option value="test">考試</option>
                    <option value="review">複習</option>
                  </select>
                  <input
                    value={item.subject}
                    onChange={(e) => {
                      const next = [...editItems];
                      next[idx] = { ...next[idx], subject: e.target.value };
                      setEditItems(next);
                    }}
                    className="border rounded px-2 py-1 text-xs flex-1"
                    placeholder="科目"
                    disabled={item._deleted}
                  />
                  <input
                    type="date"
                    value={item.due_date ?? ""}
                    onChange={(e) => {
                      const next = [...editItems];
                      next[idx] = { ...next[idx], due_date: e.target.value };
                      setEditItems(next);
                    }}
                    className="border rounded px-2 py-1 text-xs w-32"
                    disabled={item._deleted}
                  />
                </div>
                <input
                  value={item.description}
                  onChange={(e) => {
                    const next = [...editItems];
                    next[idx] = { ...next[idx], description: e.target.value };
                    setEditItems(next);
                  }}
                  className="border rounded px-2 py-1 text-xs w-full"
                  placeholder="內容"
                  disabled={item._deleted}
                />
              </div>
              <button
                onClick={() => {
                  const next = [...editItems];
                  next[idx] = { ...next[idx], _deleted: !next[idx]._deleted };
                  setEditItems(next);
                }}
                className="mt-1 text-red-400 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* New items */}
        {newItems.map((item, idx) => (
          <div key={`new-${idx}`} className="flex gap-2 items-start mb-2">
            <div className="flex-1 space-y-1">
              <div className="flex gap-1">
                <select
                  value={item.item_type}
                  onChange={(e) => {
                    const next = [...newItems];
                    next[idx] = {
                      ...next[idx],
                      item_type: e.target.value as HomeworkItemType,
                    };
                    setNewItems(next);
                  }}
                  className="border rounded px-2 py-1 text-xs w-16"
                >
                  <option value="homework">作業</option>
                  <option value="test">考試</option>
                  <option value="review">複習</option>
                </select>
                <input
                  value={item.subject}
                  onChange={(e) => {
                    const n = [...newItems];
                    n[idx] = { ...n[idx], subject: e.target.value };
                    setNewItems(n);
                  }}
                  className="border rounded px-2 py-1 text-xs flex-1"
                  placeholder="科目"
                />
                <input
                  type="date"
                  value={item.due_date}
                  onChange={(e) => {
                    const n = [...newItems];
                    n[idx] = { ...n[idx], due_date: e.target.value };
                    setNewItems(n);
                  }}
                  className="border rounded px-2 py-1 text-xs w-32"
                />
              </div>
              <input
                value={item.description}
                onChange={(e) => {
                  const n = [...newItems];
                  n[idx] = { ...n[idx], description: e.target.value };
                  setNewItems(n);
                }}
                className="border rounded px-2 py-1 text-xs w-full"
                placeholder="內容"
              />
            </div>
            <button
              onClick={() => setNewItems(newItems.filter((_, i) => i !== idx))}
              className="mt-1 text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        <button
          onClick={() =>
            setNewItems([
              ...newItems,
              {
                subject: "",
                description: "",
                due_date: today,
                item_type: "homework",
              },
            ])
          }
          className="text-xs text-blue-600 flex items-center gap-1 mb-4"
        >
          <Plus className="h-3 w-3" /> 新增作業
        </button>

        <div className="flex gap-2">
          <Button onClick={onClose} variant="outline" className="flex-1">
            取消
          </Button>
          <Button onClick={handleSave} className="flex-1" disabled={saving}>
            {saving ? "儲存中..." : "儲存"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MasterList({
  items,
  todayStudents,
  sessionId,
  onStatusChange,
  onItemsChanged,
}: MasterListProps) {
  const router = useRouter();
  const [filter, setFilter] = useState("");
  const [editingStudent, setEditingStudent] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Group items by student, include students with no items yet
  const students = useMemo(() => {
    const map = new Map<string, { name: string; items: HomeworkItem[] }>();

    // Initialize all today's students (even those with no items)
    for (const s of todayStudents) {
      map.set(s.id, { name: s.name, items: [] });
    }

    // Add items
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
        <span className="text-sm font-medium text-blue-900">
          今日進度 ({todayStudents.length} 人)
        </span>
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
              {/* Student header */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-base">{name}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      router.push(
                        `/homework/capture?student_id=${studentId}&student_name=${encodeURIComponent(name)}`,
                      )
                    }
                    className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="拍攝聯絡簿"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditingStudent({ id: studentId, name })}
                    className="p-1.5 rounded-md text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                    title="編輯作業"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {!allDone && total > 0 && (
                    <button
                      onClick={() => {
                        for (const item of studentItems) {
                          if (item.status !== "done")
                            onStatusChange(item.id, "done");
                        }
                      }}
                      className="p-1.5 rounded-md text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                      title="全部完成"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <span
                    className={`text-xs font-medium ml-1 ${allDone ? "text-green-600" : "text-gray-400"}`}
                  >
                    {total > 0 ? `${done}/${total}` : "—"}
                  </span>
                </div>
              </div>

              {/* Homework chips or empty state */}
              {noItems ? (
                <p className="text-xs text-gray-400">
                  尚未輸入作業，點擊 📷 拍攝聯絡簿
                </p>
              ) : (
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
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          {items.length === 0 && todayStudents.length === 0
            ? "今天沒有學生"
            : "沒有符合的學生"}
        </div>
      )}

      {/* Edit modal */}
      {editingStudent && (
        <EditPanel
          studentId={editingStudent.id}
          studentName={editingStudent.name}
          items={items.filter((i) => i.student_id === editingStudent.id)}
          sessionId={sessionId}
          onClose={() => setEditingStudent(null)}
          onSaved={onItemsChanged}
        />
      )}
    </div>
  );
}
