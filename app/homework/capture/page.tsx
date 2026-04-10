"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import CameraCapture from "@/components/homework/camera-capture";
import ExtractionReview from "@/components/homework/extraction-review";
import StudentSelector from "@/components/homework/student-selector";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Student } from "@/lib/types";
import { ExtractionItem } from "@/lib/types/homework";
import { useTeacherId } from "@/hooks/useTeacherId";

type FlowStep = "select" | "camera" | "extracting" | "review" | "saving";

export default function CapturePage() {
  const router = useRouter();
  const { teacherId } = useTeacherId();
  const [step, setStep] = useState<FlowStep>("select");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [extractedItems, setExtractedItems] = useState<ExtractionItem[]>([]);
  const [completedStudentIds, setCompletedStudentIds] = useState<Set<string>>(
    new Set(),
  );
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ensureSession = useCallback(async () => {
    if (sessionId) return sessionId;
    if (!teacherId) throw new Error("請先在作業追蹤頁面選擇老師");
    const res = await fetch("/api/homework/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacher_id: teacherId }),
    });
    const json = await res.json();
    if (json.data?.id) {
      setSessionId(json.data.id);
      return json.data.id;
    }
    throw new Error(json.error ?? "無法建立記錄");
  }, [sessionId, teacherId]);

  const handleStudentSelect = useCallback((student: Student) => {
    setSelectedStudent(student);
    setError(null);
    setStep("camera");
  }, []);

  const handleCapture = useCallback(
    async (blob: Blob) => {
      if (!selectedStudent) return;
      setStep("extracting");
      setError(null);

      try {
        const formData = new FormData();
        formData.append("image", blob, "capture.jpg");
        formData.append("studentName", selectedStudent.name);
        formData.append(
          "referenceDate",
          new Date().toISOString().split("T")[0],
        );

        const res = await fetch("/api/homework/extract", {
          method: "POST",
          body: formData,
        });

        const json = await res.json();

        if (!res.ok || !json.extracted_data) {
          setError(json.error ?? "AI 提取失敗");
          setStep("camera");
          return;
        }

        setExtractedItems(json.extracted_data.items ?? []);
        setStep("review");
      } catch (err) {
        setError("網路錯誤，請重試");
        setStep("camera");
      }
    },
    [selectedStudent],
  );

  const handleConfirm = useCallback(
    async (items: ExtractionItem[]) => {
      if (!selectedStudent) return;
      setStep("saving");

      try {
        const sid = await ensureSession();

        const itemsToSave = items.map((item) => ({
          session_id: sid,
          student_id: selectedStudent.id,
          item_type: item.type,
          subject: item.subject,
          description: item.description,
          due_date: item.due_date,
          status: "pending" as const,
          source: "extracted" as const,
          confidence: item.confidence,
          reminder_sent_5d: false,
          reminder_sent_2d: false,
          reminder_sent_1d: false,
        }));

        const res = await fetch("/api/homework/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: itemsToSave }),
        });

        if (!res.ok) {
          const json = await res.json();
          setError(json.error ?? "儲存失敗");
          setStep("review");
          return;
        }

        setCompletedStudentIds(
          (prev) => new Set([...prev, selectedStudent.id]),
        );
        setSelectedStudent(null);
        setExtractedItems([]);
        setStep("select");
      } catch {
        setError("儲存失敗，請重試");
        setStep("review");
      }
    },
    [selectedStudent, ensureSession],
  );

  return (
    <div className="min-h-screen bg-background">
      {step !== "camera" && (
        <div className="flex items-center gap-3 p-4 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/homework")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">拍攝聯絡簿</h1>
        </div>
      )}

      {error && step !== "camera" && (
        <div className="mx-4 mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-red-800 text-sm">
          {error}
        </div>
      )}

      {step === "select" && (
        <StudentSelector
          onSelect={handleStudentSelect}
          completedStudentIds={completedStudentIds}
        />
      )}

      {step === "camera" && (
        <CameraCapture
          onCapture={handleCapture}
          onCancel={() => {
            setSelectedStudent(null);
            setStep("select");
          }}
        />
      )}

      {step === "extracting" && (
        <div className="flex flex-col items-center justify-center gap-4 p-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-lg font-medium">AI 正在辨識...</p>
          <p className="text-muted-foreground">
            分析 {selectedStudent?.name} 的聯絡簿
          </p>
        </div>
      )}

      {step === "review" && selectedStudent && (
        <ExtractionReview
          studentName={selectedStudent.name}
          items={extractedItems}
          onConfirm={handleConfirm}
          onCancel={() => setStep("camera")}
        />
      )}

      {step === "saving" && (
        <div className="flex flex-col items-center justify-center gap-4 p-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-lg font-medium">儲存中...</p>
        </div>
      )}
    </div>
  );
}
