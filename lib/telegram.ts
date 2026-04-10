const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function sendTelegram(message: string): Promise<boolean> {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn("Telegram not configured: missing BOT_TOKEN or CHAT_ID");
    return false;
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "HTML",
      }),
    });

    if (!res.ok) {
      console.error(`Telegram send failed: ${res.status} ${res.statusText}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Telegram send error:", err);
    return false;
  }
}
