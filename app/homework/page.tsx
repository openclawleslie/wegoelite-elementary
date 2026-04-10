"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Camera, Calendar, ArrowLeft } from "lucide-react";
import MasterList from "@/components/homework/master-list";
import ReminderBanner from "@/components/homework/reminder-banner";
import PrintButton from "@/components/homework/print-button";
import { HomeworkItem, HomeworkItemStatus } from "@/lib/types/homework";

function HomeworkDashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<HomeworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().split("T")[0];
  const selectedDate = searchParams.get("date") || today;
  const isToday = selectedDate === today;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        // Get or create session (POST always uses today for creation)
        const sessionRes = await fetch(
          isToday
            ? "/api/homework/sessions"
            : `/api/homework/sessions?date=${selectedDate}`,
          isToday ? { method: "POST" } : undefined,
        );
        if (!sessionRes.ok) {
          if (!isToday) {
            // No session for that date, just show empty
            setItems([]);
            return;
          }
          setError("無法載入記錄");
          return;
        }
        const sessionJson = await sessionRes.json();
        const sessions = isToday
          ? [sessionJson.data]
          : (sessionJson.data ?? []);
        if (sessions.length === 0 || !sessions[0]?.id) {
          setItems([]);
          return;
        }

        const sid = sessions[0].id;
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
    loadData();
  }, [selectedDate, isToday]);

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

      <div className="p-4 space-y-6">
        {isToday && (
          <Button
            onClick={() => router.push("/homework/capture")}
            className="w-full h-14 text-lg"
          >
            <Camera className="mr-2 h-5 w-5" />
            拍攝聯絡簿
          </Button>
        )}

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
          <MasterList items={items} onStatusChange={handleStatusChange} />
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
