"use client";

import { Teacher } from "@/lib/types";

interface TeacherPickerProps {
  teachers: Teacher[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function TeacherPicker({
  teachers,
  selectedId,
  onSelect,
}: TeacherPickerProps) {
  if (teachers.length === 0) return null;

  return (
    <div className="flex items-center gap-2 p-4 border-b bg-amber-50">
      <span className="text-sm font-medium text-amber-800">老師：</span>
      <select
        value={selectedId ?? ""}
        onChange={(e) => onSelect(e.target.value)}
        className="rounded-md border px-3 py-1.5 text-sm bg-background"
      >
        <option value="" disabled>
          請選擇老師
        </option>
        {teachers.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}
