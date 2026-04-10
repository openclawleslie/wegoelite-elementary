"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft } from "lucide-react";
import MasterList from "@/components/homework/master-list";
import ProgressList, {
  ProgressItem,
  type ProgressStatus,
} from "@/components/homework/progress-list";
import ReminderBanner from "@/components/homework/reminder-banner";
import PrintButton from "@/components/homework/print-button";
import { HomeworkItem, HomeworkItemStatus } from "@/lib/types/homework";

type Tab = "school" | "progress";

function HomeworkDashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<HomeworkItem[]>([]);
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([]);
  const [todayStudents, setTodayStudents] = useState<
    { id: string; name: string }[]
  >([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("school");
  const [submitting, setSubmitting] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const selectedDate = searchParams.get("date") || today;
  const isToday = selectedDate === today;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all data in parallel — progress is independent of homework sessions
      const [studentsRes, progressRes] = await Promise.all([
        fetch("/api/students?status=active"),
        fetch(`/api/progress?date=${selectedDate}`),
      ]);

      if (studentsRes.ok) {
        const studentsJson = await studentsRes.json();
        setTodayStudents(
          (studentsJson.data ?? []).map((s: any) => ({
            id: s.id,
            name: s.name,
          })),
        );
      }

      if (progressRes.ok) {
        const progressJson = await progressRes.json();
        setProgressItems(progressJson.data ?? []);
      }

      // Get or create homework session (separate from progress)
      try {
        const sessionRes = await fetch(
          isToday
            ? "/api/homework/sessions"
            : `/api/homework/sessions?date=${selectedDate}`,
          isToday ? { method: "POST" } : undefined,
        );
        if (sessionRes.ok) {
          const sessionJson = await sessionRes.json();
          const sessions = isToday
            ? [sessionJson.data]
            : (sessionJson.data ?? []);
          if (sessions.length > 0 && sessions[0]?.id) {
            const sid = sessions[0].id;
            setSessionId(sid);
            const itemsRes = await fetch(
              `/api/homework/items?session_id=${sid}`,
            );
            if (itemsRes.ok) {
              const itemsJson = await itemsRes.json();
              setItems(itemsJson.data ?? []);
            }
          }
        }
      } catch {
        // Homework session fetch failed, but progress tab still works
      }
    } catch {
      setError("網路錯誤，請重新整理");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, isToday]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
            const ci = ["pending", "in_progress", "done"].indexOf(newStatus);
            return {
              ...item,
              status: ["pending", "in_progress", "done"][
                (ci - 1 + 3) % 3
              ] as HomeworkItemStatus,
            };
          }),
        );
      }
    },
    [],
  );

  const handleProgressToggle = useCallback(
    async (itemId: string, newStatus: ProgressStatus) => {
      setProgressItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, status: newStatus } : item,
        ),
      );
      await fetch(`/api/progress?id=${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    },
    [],
  );

  const handleSubmitDay = useCallback(async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/progress/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate }),
      });
      const json = await res.json();
      if (res.ok) {
        alert(json.message);
        loadData();
      } else {
        alert(json.error ?? "提交失敗");
      }
    } finally {
      setSubmitting(false);
    }
  }, [selectedDate, loadData]);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          {!isToday && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/homework")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-xl font-bold">小學作業追蹤</h1>
            <p className="text-sm text-muted-foreground">
              {selectedDate}
              {!isToday && " (查看歷史)"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <PrintButton items={items} date={selectedDate} />
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

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setTab("school")}
          className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
            tab === "school"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          學校作業
        </button>
        <button
          onClick={() => setTab("progress")}
          className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
            tab === "progress"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          進度
        </button>
      </div>

      <div className="p-4 space-y-4">
        {tab === "school" && (
          <>
            {isToday && <ReminderBanner />}

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
              <MasterList
                items={items}
                todayStudents={todayStudents}
                sessionId={sessionId}
                onStatusChange={handleStatusChange}
                onItemsChanged={loadData}
              />
            )}
          </>
        )}

        {tab === "progress" && (
          <ProgressList
            items={progressItems}
            todayStudents={todayStudents}
            date={selectedDate}
            onStatusToggle={handleProgressToggle}
            onSubmitDay={handleSubmitDay}
            isSubmitting={submitting}
          />
        )}
      </div>
    </div>
  );
}

export default function HomeworkDashboard() {
  return (
    <Suspense fallback={<div className="p-8 text-center">載入中...</div>}>
      <HomeworkDashboardInner />
    </Suspense>
  );
}
