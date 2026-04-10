"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Camera } from "lucide-react";
import { Student } from "@/lib/types";

interface StudentSelectorProps {
  onSelect: (student: Student) => void;
  completedStudentIds: Set<string>;
}

export default function StudentSelector({
  onSelect,
  completedStudentIds,
}: StudentSelectorProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    async function fetchStudents() {
      try {
        const res = await fetch("/api/students?status=active");
        if (!res.ok) {
          setFetchError(true);
          return;
        }
        const json = await res.json();
        setStudents(json.data ?? []);
      } catch {
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        載入學生名單...
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-red-600 font-medium">無法載入學生名單</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-primary underline"
        >
          重新整理
        </button>
      </div>
    );
  }

  const remaining = students.filter((s) => !completedStudentIds.has(s.id));
  const completed = students.filter((s) => completedStudentIds.has(s.id));

  return (
    <div className="space-y-6 p-4">
      <div className="text-center">
        <h2 className="text-xl font-bold">選擇學生</h2>
        <p className="text-muted-foreground mt-1">
          已完成 {completedStudentIds.size}/{students.length}
        </p>
      </div>

      {remaining.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">待拍攝</h3>
          <div className="grid grid-cols-2 gap-3">
            {remaining.map((student) => (
              <Card
                key={student.id}
                className="p-4 cursor-pointer hover:border-primary transition-colors active:scale-95"
                onClick={() => onSelect(student)}
              >
                <div className="flex items-center gap-3">
                  <Camera className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{student.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {student.grade}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">已完成</h3>
          <div className="grid grid-cols-2 gap-3">
            {completed.map((student) => (
              <Card
                key={student.id}
                className="p-4 opacity-60 border-green-200 bg-green-50"
              >
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="font-medium">{student.name}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {remaining.length === 0 && students.length > 0 && (
        <div className="text-center py-8">
          <p className="text-lg font-medium text-green-600">全部完成!</p>
        </div>
      )}
    </div>
  );
}
