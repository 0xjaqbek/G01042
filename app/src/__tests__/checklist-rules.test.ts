import { describe, it, expect } from "vitest";

describe("Checklist lockout logic", () => {
  function isChecklistLocked(checklistDate: string, now: Date): boolean {
    const endOfDay = new Date(`${checklistDate}T23:59:59`);
    return now > endOfDay;
  }

  it("allows editing on the same day", () => {
    const now = new Date("2026-08-22T14:00:00");
    expect(isChecklistLocked("2026-08-22", now)).toBe(false);
  });

  it("allows editing at 23:59:59", () => {
    const now = new Date("2026-08-22T23:59:59");
    expect(isChecklistLocked("2026-08-22", now)).toBe(false);
  });

  it("locks after midnight (next day)", () => {
    const now = new Date("2026-08-23T00:00:01");
    expect(isChecklistLocked("2026-08-22", now)).toBe(true);
  });

  it("locks for past dates", () => {
    const now = new Date("2026-08-25T10:00:00");
    expect(isChecklistLocked("2026-08-22", now)).toBe(true);
  });
});
