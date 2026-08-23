// Unambiguous long-form dates everywhere (never dd/mm/yyyy or mm/dd/yyyy): "August 26, 2026".
export function formatDate(date: string | number | Date): string {
  // Date-only strings ("YYYY-MM-DD") parse as UTC midnight, which can show as the previous day
  // in negative-UTC timezones — force local-time parsing for that shape.
  const d = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00`) : new Date(date);
  return d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

// "August 26, 2026 - September 1, 2026"
export function formatDateRange(start: string | number | Date, end?: string | number | Date | null): string {
  if (!end) return formatDate(start);
  return `${formatDate(start)} - ${formatDate(end)}`;
}

// "August 26, 2026, 3:45 PM" — for timestamps where the time of day matters too.
export function formatDateTime(date: string | number | Date): string {
  return new Date(date).toLocaleString("en-US", { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" });
}
