import { NextRequest, NextResponse } from "next/server";
import { parseExtractionResponse } from "@/lib/homework/parse-extraction";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * POST /api/homework/extract
 * Upload a photo of a student's assignment book → Claude Vision extracts structured homework data
 *
 * Body: FormData with { image: File, studentName: string, referenceDate: string }
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;
    const studentName = formData.get("studentName") as string;
    const referenceDate =
      (formData.get("referenceDate") as string) ||
      new Date().toISOString().split("T")[0];

    if (!imageFile) {
      return NextResponse.json({ error: "未上傳圖片" }, { status: 400 });
    }

    const openrouterKey = process.env.OPENROUTER_API_KEY;
    if (!openrouterKey) {
      return NextResponse.json({ error: "AI 服務未設定" }, { status: 500 });
    }

    const bytes = await imageFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = imageFile.type || "image/jpeg";

    const prompt = `你是一個作業記錄助理。我會給你一張學生聯絡簿的照片。
這本聯絡簿是繁體中文的，內容包含今天的作業、複習項目、以及未來的考試日期。

學生姓名：${studentName}
今天日期：${referenceDate}

請提取所有學生手寫或老師填寫的內容（忽略印刷好的欄位標題）。
如果看到相對日期（如「下週五」），請根據今天日期 ${referenceDate} 換算成絕對日期。

輸出格式為 JSON：
{
  "student_name": "${studentName}",
  "date_captured": "${referenceDate}",
  "items": [
    {
      "type": "homework|test|review",
      "subject": "科目名稱",
      "description": "具體內容",
      "due_date": "YYYY-MM-DD 或 null",
      "confidence": "high|low"
    }
  ]
}

如果日期不明確，due_date 填 null。
如果某項目你不確定內容，加上 "confidence": "low"。
只輸出 JSON，不要輸出其他文字。`;

    const orResponse = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openrouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://wegoelites.com",
        "X-Title": "WeGoElites Homework",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!orResponse.ok) {
      const errBody = await orResponse.text();
      return NextResponse.json(
        { error: `AI 辨識失敗: ${errBody}` },
        { status: 500 },
      );
    }

    const orData = await orResponse.json();
    const rawContent = orData.choices?.[0]?.message?.content ?? "";
    const extracted = parseExtractionResponse(rawContent);

    if (!extracted) {
      return NextResponse.json(
        { error: "無法解析 AI 回應", raw: rawContent },
        { status: 500 },
      );
    }

    return NextResponse.json({ extracted_data: extracted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
