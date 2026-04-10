"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Camera, Calendar } from "lucide-react";
import MasterList from "@/components/homework/master-list";
import ReminderBanner from "@/components/homework/reminder-banner";
import PrintButton from "@/components/homework/print-button";
import TeacherPicker from "@/components/homework/teacher-picker";
import { useTeacherId } from "@/hooks/useTeacherId";
import { HomeworkItem, HomeworkItemStatus } from "@/lib/types/homework";

export default function HomeworkDashboard() {
  const router = useRouter();
  const [items, setItems] = useState<HomeworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const {
    teacherId,
    setTeacherId,
    teachers,
    loading: teacherLoading,
  } = useTeacherId();
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!teacherId) {
      setLoading(false);
      return;
    }

    async function loadTodayData() {
      setLoading(true);
      setError(null);
      try {
        const sessionRes = await fetch("/api/homework/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teacher_id: teacherId }),
        });
        if (!sessionRes.ok) {
          setError("無法載入今日記錄");
          return;
        }
        const sessionJson = await sessionRes.json();
        const sid = sessionJson.data?.id;
        if (!sid) return;
        setSessionId(sid);

        const itemsRes = await fetch(`/api/homework/items?session_id=${sid}`);
        if (!itemsRes.ok) {
          setError("無法載入作業項目");
          return;
        }
        const itemsJson = await itemsRes.json();
        setItems(itemsJson.data ?? []);
      } catch {
        setError("網路錯誤，請重新整理");
      } finally {
        setLoading(false);
      }
    }
    loadTodayData();
  }, [teacherId]);

  const handleStatusChange = useCallback(
    async (itemId: string, newStatus: HomeworkItemStatus) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, status: newStatus } : item,
        ),
      );

      const res = await fetch(`/api/homework/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        setItems((prev) =>
          prev.map((item) => {
            if (item.id !== itemId) return item;
            const currentIndex = ["pending", "in_progress", "done"].indexOf(
              newStatus,
            );
            const prevStatus = ["pending", "in_progress", "done"][
              (currentIndex - 1 + 3) % 3
            ] as HomeworkItemStatus;
            return { ...item, status: prevStatus };
          }),
        );
      }
    },
    [],
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h1 className="text-xl font-bold">作業追蹤</h1>
          <p className="text-sm text-muted-foreground">{today}</p>
        </div>
        <div className="flex gap-2">
          <PrintButton items={items} date={today} />
          <Button
            onClick={() => router.push("/homework/calendar")}
            variant="outline"
            size="icon"
            aria-label="行事曆"
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!teacherId && !teacherLoading && (
        <TeacherPicker
          teachers={teachers}
          selectedId={teacherId}
          onSelect={setTeacherId}
        />
      )}

      <div className="p-4 space-y-6">
        {!teacherId && !teacherLoading && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-center text-amber-800">
            請先選擇老師
          </div>
        )}

        <Button
          onClick={() => router.push("/homework/capture")}
          className="w-full h-14 text-lg"
          disabled={!teacherId}
        >
          <Camera className="mr-2 h-5 w-5" />
          拍攝聯絡簿
        </Button>

        <ReminderBanner />

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-red-800 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">
            載入中...
          </div>
        ) : (
          <MasterList items={items} onStatusChange={handleStatusChange} />
        )}
      </div>
    </div>
  );
}
