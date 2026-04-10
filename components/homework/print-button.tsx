"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { HomeworkItem } from "@/lib/types/homework";

interface PrintButtonProps {
  items: HomeworkItem[];
  date: string;
}

const TYPE_LABELS: Record<string, string> = {
  homework: "作業",
  test: "考試",
  review: "複習",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "☐",
  in_progress: "△",
  done: "✓",
};

export default function PrintButton({ items, date }: PrintButtonProps) {
  const generatePDF = useCallback(() => {
    const doc = new jsPDF("p", "mm", "a4");

    doc.setFontSize(16);
    doc.text(`WeGoElite 每日作業清單 — ${date}`, 14, 20);

    const grouped = new Map<string, { name: string; items: HomeworkItem[] }>();
    for (const item of items) {
      const name = item.student?.name ?? "未知";
      if (!grouped.has(item.student_id)) {
        grouped.set(item.student_id, { name, items: [] });
      }
      grouped.get(item.student_id)!.items.push(item);
    }

    let y = 30;

    for (const [, { name, items: studentItems }] of grouped) {
      doc.setFontSize(12);
      doc.text(name, 14, y);
      y += 2;

      autoTable(doc, {
        startY: y,
        head: [["完成", "類型", "科目", "內容", "截止日"]],
        body: studentItems.map((item) => [
          STATUS_LABELS[item.status] ?? "☐",
          TYPE_LABELS[item.item_type] ?? item.item_type,
          item.subject,
          item.description,
          item.due_date ?? "-",
        ]),
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [27, 42, 74] },
        columnStyles: {
          0: { cellWidth: 12, halign: "center" },
          1: { cellWidth: 15 },
          2: { cellWidth: 20 },
          3: { cellWidth: "auto" },
          4: { cellWidth: 25 },
        },
        margin: { left: 14, right: 14 },
      });

      y = (doc as any).lastAutoTable.finalY + 10;

      if (y > 260) {
        doc.addPage();
        y = 20;
      }
    }

    const totalDone = items.filter((i) => i.status === "done").length;
    doc.setFontSize(10);
    doc.text(
      `共 ${items.length} 項 | 已完成 ${totalDone} 項 | 列印時間 ${new Date().toLocaleString("zh-TW")}`,
      14,
      y,
    );

    doc.save(`homework-${date}.pdf`);
  }, [items, date]);

  return (
    <Button
      onClick={generatePDF}
      variant="outline"
      disabled={items.length === 0}
    >
      <Printer className="mr-2 h-4 w-4" />
      列印今日清單
    </Button>
  );
}
