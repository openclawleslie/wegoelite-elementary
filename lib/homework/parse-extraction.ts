import { ExtractionResult, ExtractionItem } from "../types/homework";

export function parseExtractionResponse(raw: string): ExtractionResult | null {
  try {
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch?.[1]?.trim() ?? raw.trim();

    const parsed = JSON.parse(jsonStr);

    if (!parsed.student_name || !Array.isArray(parsed.items)) {
      return null;
    }

    const items: ExtractionItem[] = parsed.items.map((item: any) => ({
      type: ["homework", "test", "review"].includes(item.type)
        ? item.type
        : "homework",
      subject: String(item.subject ?? ""),
      description: String(item.description ?? ""),
      due_date: item.due_date ?? null,
      confidence: item.confidence === "low" ? "low" : "high",
    }));

    return {
      student_name: String(parsed.student_name),
      date_captured:
        parsed.date_captured ?? new Date().toISOString().split("T")[0],
      items,
    };
  } catch {
    return null;
  }
}
