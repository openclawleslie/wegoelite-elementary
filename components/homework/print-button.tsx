"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
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
  const handlePrint = useCallback(() => {
    // Group by student
    const grouped = new Map<string, { name: string; items: HomeworkItem[] }>();
    for (const item of items) {
      const name = item.student?.name ?? "未知";
      if (!grouped.has(item.student_id)) {
        grouped.set(item.student_id, { name, items: [] });
      }
      grouped.get(item.student_id)!.items.push(item);
    }

    const totalDone = items.filter((i) => i.status === "done").length;

    // Build student sections
    let studentSections = "";
    for (const [, { name, items: studentItems }] of grouped) {
      const rows = studentItems
        .map(
          (item) => `
        <tr>
          <td style="text-align:center;width:36px">${STATUS_LABELS[item.status] ?? "☐"}</td>
          <td style="width:44px">${TYPE_LABELS[item.item_type] ?? item.item_type}</td>
          <td style="width:52px">${item.subject}</td>
          <td>${item.description}</td>
          <td style="width:90px;text-align:right">${item.due_date ?? "-"}</td>
        </tr>`,
        )
        .join("");

      studentSections += `
        <div style="margin-bottom:16px;page-break-inside:avoid">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px">${name}</div>
          <table style="width:100%;border-collapse:collapse;font-size:12px">
            <thead>
              <tr style="background:#1B2A4A;color:#fff">
                <th style="padding:4px 6px;text-align:center">完成</th>
                <th style="padding:4px 6px;text-align:left">類型</th>
                <th style="padding:4px 6px;text-align:left">科目</th>
                <th style="padding:4px 6px;text-align:left">內容</th>
                <th style="padding:4px 6px;text-align:right">截止日</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    }

    const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="utf-8">
  <title>WeGoElite 小學作業清單 ${date}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: "Microsoft JhengHei", "PingFang TC", "Noto Sans TC", sans-serif; padding:20px; color:#111; }
    h1 { font-size:18px; margin-bottom:4px; }
    .subtitle { font-size:12px; color:#666; margin-bottom:16px; }
    table { width:100%; border-collapse:collapse; }
    th, td { padding:4px 6px; border-bottom:1px solid #ddd; }
    tbody tr:nth-child(even) { background:#f9f9f9; }
    .footer { margin-top:20px; font-size:10px; color:#999; border-top:1px solid #ddd; padding-top:8px; }
    @media print {
      body { padding:10px; }
      .no-print { display:none; }
    }
  </style>
</head>
<body>
  <h1>WeGoElite 小學每日作業清單</h1>
  <div class="subtitle">${date} | 共 ${items.length} 項 | 已完成 ${totalDone} 項</div>
  ${studentSections}
  <div class="footer">列印時間 ${new Date().toLocaleString("zh-TW")}</div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  }, [items, date]);

  return (
    <Button
      onClick={handlePrint}
      variant="outline"
      disabled={items.length === 0}
    >
      <Printer className="mr-2 h-4 w-4" />
      列印今日清單
    </Button>
  );
}
