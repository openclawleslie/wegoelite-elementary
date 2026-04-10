/**
 * Reliable Taipei timezone utilities using Intl.DateTimeFormat.
 *
 * Avoids the fragile `new Date(date.toLocaleString(...))` pattern
 * whose output format varies by runtime.
 */

const TAIPEI_TZ = "Asia/Taipei";

/**
 * Get the current date parts in Asia/Taipei timezone.
 * Uses Intl.DateTimeFormat which is stable across runtimes.
 */
export function getTaipeiDateParts(date: Date = new Date()): {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  weekday: number; // 0=Sun, 1=Mon, ..., 6=Sat
} {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TAIPEI_TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    weekday: "short",
  });

  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? "0";

  const weekdayStr = get("weekday");
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    year: parseInt(get("year"), 10),
    month: parseInt(get("month"), 10),
    day: parseInt(get("day"), 10),
    hour: parseInt(get("hour"), 10),
    minute: parseInt(get("minute"), 10),
    weekday: weekdayMap[weekdayStr] ?? 0,
  };
}

/**
 * Get today's date string (YYYY-MM-DD) in Taipei timezone.
 */
export function getTaipeiToday(date: Date = new Date()): string {
  const { year, month, day } = getTaipeiDateParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Get a Date object representing the start of today in Taipei timezone.
 * Note: The returned Date is in UTC but represents the Taipei calendar date.
 */
export function getTaipeiDate(date: Date = new Date()): Date {
  const { year, month, day } = getTaipeiDateParts(date);
  return new Date(year, month - 1, day);
}
