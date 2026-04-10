"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CameraCapture from "@/components/homework/camera-capture";
import ExtractionReview from "@/components/homework/extraction-review";
import StudentSelector from "@/components/homework/student-selector";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Student } from "@/lib/types";
import { ExtractionItem } from "@/lib/types/homework";

type FlowStep = "select" | "camera" | "extracting" | "review" | "saving";

function CapturePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // If student_id is in URL params, skip the selector and go straight to camera
  const paramStudentId = searchParams.get("student_id");
  const paramStudentName = searchParams.get("student_name");
  const hasDirectStudent = !!(paramStudentId && paramStudentName);

  const [step, setStep] = useState<FlowStep>(
    hasDirectStudent ? "camera" : "select",
  );
  const [selectedStudent, setSelectedStudent] = useState<Pick<
    Student,
    "id" | "name"
  > | null>(
    hasDirectStudent
      ? ({
          id: paramStudentId!,
          name: decodeURIComponent(paramStudentName!),
        } as any)
      : null,
  );
  const [extractedItems, setExtractedItems] = useState<ExtractionItem[]>([]);
  const [completedStudentIds, setCompletedStudentIds] = useState<Set<string>>(
    new Set(),
  );
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ensureSession = useCallback(async () => {
    if (sessionId) return sessionId;
    const res = await fetch("/api/homework/sessions", { method: "POST" });
    const json = await res.json();
    if (json.data?.id) {
      setSessionId(json.data.id);
      return json.data.id;
    }
    throw new Error(json.error ?? "無法建立記錄");
  }, [sessionId]);

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
      } catch {
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

        // If came from direct student link, go back to dashboard
        if (hasDirectStudent) {
          router.push("/homework");
          return;
        }

        // Otherwise continue with student selector flow
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
    [selectedStudent, ensureSession, hasDirectStudent, router],
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
          <h1 className="text-lg font-bold">
            {selectedStudent ? `${selectedStudent.name} 聯絡簿` : "拍攝聯絡簿"}
          </h1>
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
            if (hasDirectStudent) {
              router.push("/homework");
              return;
            }
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

export default function CapturePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">載入中...</div>}>
      <CapturePageInner />
    </Suspense>
  );
}
