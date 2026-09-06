import { describe, it, expect } from "vitest";
import { formatDate, formatDateTime, formatTime, istDateKey } from "./format-date";

// These assertions must hold regardless of the machine's TZ (CI runs UTC).
const norm = (s: string) => s.replace(/\s+/g, " ");

describe("format-date is always IST", () => {
  it("formatDate keeps the calendar day for a date-only string", () => {
    expect(formatDate("2026-08-30")).toBe("August 30, 2026");
  });

  it("formatDateTime renders the instant in IST", () => {
    // 2026-08-29T21:00:00Z === 2026-08-30 02:30 AM IST
    expect(norm(formatDateTime("2026-08-29T21:00:00Z"))).toMatch(/^August 30, 2026(,| at) 2:30 AM$/);
  });

  it("formatTime renders IST wall-clock", () => {
    expect(norm(formatTime("2026-08-29T21:00:00Z"))).toBe("2:30 AM");
  });

  it("istDateKey rolls to the IST day, not the UTC day", () => {
    // 20:00 UTC on Aug 29 is already Aug 30 in IST (+5:30)
    expect(istDateKey("2026-08-29T20:00:00Z")).toBe("2026-08-30");
    expect(istDateKey("2026-08-29T17:00:00Z")).toBe("2026-08-29");
  });
});
