"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { HomeworkItem } from "@/lib/types/homework";

interface PrintButtonProps {
  items: HomeworkItem[];
  date: string;
}

function formatItem(item: HomeworkItem, today: string): string {
  const prefix =
    item.item_type === "test" ? "考" : item.item_type === "review" ? "複" : "";
  const tag = prefix ? `<b>${prefix}</b> ` : "";
  const due =
    item.due_date && item.due_date !== today
      ? ` <span style="color:#999;font-size:8px">${new Date(item.due_date).getMonth() + 1}/${new Date(item.due_date).getDate()}</span>`
      : "";
  const check =
    item.status === "done" ? "✓" : item.status === "in_progress" ? "△" : "☐";
  return `<span style="display:inline-block;margin:1px 3px 1px 0;padding:1px 4px;border:1px solid #ccc;border-radius:3px;font-size:9px;white-space:nowrap;${item.status === "done" ? "background:#e8f5e9;border-color:#a5d6a7;" : ""}">${check} ${tag}${item.subject} ${item.description}${due}</span>`;
}

export default function PrintButton({ items, date }: PrintButtonProps) {
  const handlePrint = useCallback(() => {
    const grouped = new Map<string, { name: string; items: HomeworkItem[] }>();
    for (const item of items) {
      const name = item.student?.name ?? "未知";
      if (!grouped.has(item.student_id)) {
        grouped.set(item.student_id, { name, items: [] });
      }
      grouped.get(item.student_id)!.items.push(item);
    }

    const totalDone = items.filter((i) => i.status === "done").length;
    const students = Array.from(grouped.entries()).sort((a, b) =>
      a[1].name.localeCompare(b[1].name, "zh-TW"),
    );

    const rows = students
      .map(([, { name, items: si }]) => {
        const done = si.filter((i) => i.status === "done").length;
        const chips = si.map((i) => formatItem(i, date)).join("");
        return `<tr>
        <td style="width:60px;font-weight:700;font-size:11px;vertical-align:top;padding:4px 6px;border-bottom:1px solid #eee;white-space:nowrap">${name}</td>
        <td style="padding:3px 4px;border-bottom:1px solid #eee;line-height:1.6">${chips}</td>
        <td style="width:30px;text-align:center;font-size:10px;color:#888;vertical-align:top;padding:4px 2px;border-bottom:1px solid #eee">${done}/${si.length}</td>
      </tr>`;
      })
      .join("");

    const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="utf-8">
  <title>WeGoElite 小學作業清單 ${date}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: "PingFang TC", "Microsoft JhengHei", "Noto Sans TC", sans-serif; color:#111; font-size:10px; }
    h1 { font-size:14px; font-weight:700; }
    .meta { font-size:9px; color:#666; margin-bottom:8px; }
    table { width:100%; border-collapse:collapse; }
    .footer { margin-top:8px; font-size:8px; color:#aaa; }
    @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
  </style>
</head>
<body>
  <h1>WeGoElite 小學作業清單 ${date}</h1>
  <div class="meta">共 ${items.length} 項 | 已完成 ${totalDone} 項 | 學生 ${students.length} 人</div>
  <table>${rows}</table>
  <div class="footer">列印 ${new Date().toLocaleString("zh-TW")}</div>
  <script>window.onload=function(){window.print()}</script>
</body>
</html>`;

    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
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
