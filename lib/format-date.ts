// All dates/times render in IST (Asia/Kolkata) regardless of server timezone.
// ponytail: single timezone hardcoded — Gyan Setu operates only in India.
export const IST = "Asia/Kolkata";

// Unambiguous long-form dates everywhere (never dd/mm/yyyy or mm/dd/yyyy): "August 26, 2026".
export function formatDate(date: string | number | Date): string {
  // Date-only strings ("YYYY-MM-DD") parse as UTC midnight; in IST that's 5:30 AM the same
  // day, so timeZone: IST keeps the calendar day correct.
  const d = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00`) : new Date(date);
  return d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric", timeZone: IST });
}

// "August 26, 2026 - September 1, 2026"
export function formatDateRange(start: string | number | Date, end?: string | number | Date | null): string {
  if (!end) return formatDate(start);
  return `${formatDate(start)} - ${formatDate(end)}`;
}

// "August 26, 2026, 3:45 PM" — for timestamps where the time of day matters too.
export function formatDateTime(date: string | number | Date): string {
  return new Date(date).toLocaleString("en-US", { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: IST });
}

// "3:45 PM" — time of day only, in IST.
export function formatTime(date: string | number | Date): string {
  return new Date(date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: IST });
}

// "2026-08-30" for the given instant in IST — use for same-calendar-day comparisons.
export function istDateKey(date: string | number | Date = new Date()): string {
  return new Date(date).toLocaleDateString("en-CA", { timeZone: IST });
}
