"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, AlertTriangle, Check } from "lucide-react";
import {
  ExtractionItem,
  HomeworkItemType,
  HomeworkConfidence,
} from "@/lib/types/homework";

interface ExtractionReviewProps {
  studentName: string;
  items: ExtractionItem[];
  onConfirm: (items: ExtractionItem[]) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const TYPE_LABELS: Record<HomeworkItemType, string> = {
  homework: "作業",
  test: "考試",
  review: "複習",
};

const TYPE_OPTIONS: HomeworkItemType[] = ["homework", "test", "review"];

export default function ExtractionReview({
  studentName,
  items: initialItems,
  onConfirm,
  onCancel,
  isSubmitting = false,
}: ExtractionReviewProps) {
  const [items, setItems] = useState<ExtractionItem[]>(initialItems);

  function updateItem(
    index: number,
    field: keyof ExtractionItem,
    value: string,
  ) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        type: "homework" as HomeworkItemType,
        subject: "",
        description: "",
        due_date: null,
        confidence: "high" as HomeworkConfidence,
      },
    ]);
  }

  return (
    <div className="space-y-4 p-4">
      <div className="text-center">
        <h2 className="text-xl font-bold">{studentName}</h2>
        <p className="text-muted-foreground">
          {items.length} 個項目 — 請確認或修改
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <Card
            key={index}
            className={`p-4 space-y-3 ${item.confidence === "low" ? "border-amber-300 bg-amber-50" : ""}`}
          >
            {item.confidence === "low" && (
              <div className="flex items-center gap-2 text-amber-600 text-sm">
                <AlertTriangle className="h-4 w-4" />
                AI 不確定此項目，請確認
              </div>
            )}

            <div className="flex gap-2">
              <select
                value={item.type}
                onChange={(e) => updateItem(index, "type", e.target.value)}
                className="rounded-md border px-3 py-2 text-sm bg-background"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </select>

              <Input
                value={item.subject}
                onChange={(e) => updateItem(index, "subject", e.target.value)}
                placeholder="科目"
                className="flex-1"
              />

              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem(index)}
                className="text-red-500 hover:text-red-700 shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <Input
              value={item.description}
              onChange={(e) => updateItem(index, "description", e.target.value)}
              placeholder="內容描述"
            />

            <Input
              type="date"
              value={item.due_date ?? ""}
              onChange={(e) =>
                updateItem(index, "due_date", e.target.value || (null as any))
              }
              placeholder="截止日期"
            />
          </Card>
        ))}
      </div>

      <Button onClick={addItem} variant="outline" className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        新增項目
      </Button>

      <div className="flex gap-3 pt-4">
        <Button onClick={onCancel} variant="outline" className="flex-1 h-12">
          取消
        </Button>
        <Button
          onClick={() => onConfirm(items)}
          className="flex-1 h-12"
          disabled={isSubmitting || items.length === 0}
        >
          <Check className="mr-2 h-4 w-4" />
          {isSubmitting ? "儲存中..." : `確認 ${items.length} 個項目`}
        </Button>
      </div>
    </div>
  );
}
