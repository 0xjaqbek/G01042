import { describe, it, expect } from "vitest";

/**
 * Tests for validation logic extracted from API routes.
 * These test the same patterns used in route handlers without requiring DB.
 */

// ---------------------------------------------------------------------------
// PIN validation (from admin/users PATCH)
// ---------------------------------------------------------------------------

describe("PIN validation", () => {
  const PIN_REGEX = /^\d{4,6}$/;

  it("accepts 4-digit PIN", () => {
    expect(PIN_REGEX.test("1234")).toBe(true);
  });

  it("accepts 5-digit PIN", () => {
    expect(PIN_REGEX.test("12345")).toBe(true);
  });

  it("accepts 6-digit PIN", () => {
    expect(PIN_REGEX.test("123456")).toBe(true);
  });

  it("rejects 3-digit PIN", () => {
    expect(PIN_REGEX.test("123")).toBe(false);
  });

  it("rejects 7-digit PIN", () => {
    expect(PIN_REGEX.test("1234567")).toBe(false);
  });

  it("rejects non-numeric PIN", () => {
    expect(PIN_REGEX.test("abcd")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(PIN_REGEX.test("")).toBe(false);
  });

  it("rejects PIN with spaces", () => {
    expect(PIN_REGEX.test("12 34")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Role validation (from admin/users PATCH)
// ---------------------------------------------------------------------------

describe("Role validation", () => {
  const VALID_ROLES = ["kierowca", "ratownik", "oba"];

  it("accepts all valid roles", () => {
    for (const role of VALID_ROLES) {
      expect(VALID_ROLES.includes(role)).toBe(true);
    }
  });

  it("rejects invalid role", () => {
    expect(VALID_ROLES.includes("admin")).toBe(false);
    expect(VALID_ROLES.includes("")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isFutureMonth (from proposals/route.ts)
// ---------------------------------------------------------------------------

describe("isFutureMonth", () => {
  // Extracted from proposals/route.ts
  function isFutureMonth(year: number, month: number) {
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return false;
    const now = new Date();
    return year * 12 + month > now.getFullYear() * 12 + now.getMonth() + 1;
  }

  it("rejects past months", () => {
    expect(isFutureMonth(2020, 1)).toBe(false);
  });

  it("rejects current month", () => {
    const now = new Date();
    expect(isFutureMonth(now.getFullYear(), now.getMonth() + 1)).toBe(false);
  });

  it("accepts next month", () => {
    const next = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
    expect(isFutureMonth(next.getFullYear(), next.getMonth() + 1)).toBe(true);
  });

  it("accepts far future month", () => {
    expect(isFutureMonth(2030, 6)).toBe(true);
  });

  it("rejects invalid month 0", () => {
    expect(isFutureMonth(2030, 0)).toBe(false);
  });

  it("rejects invalid month 13", () => {
    expect(isFutureMonth(2030, 13)).toBe(false);
  });

  it("rejects non-integer year", () => {
    expect(isFutureMonth(2026.5, 6)).toBe(false);
  });

  it("rejects non-integer month", () => {
    expect(isFutureMonth(2026, 6.5)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Schedule entry validation (from schedule/route.ts POST)
// ---------------------------------------------------------------------------

describe("Schedule entry validation", () => {
  const VALID_SHIFT_TYPES = ["D", "N", "DN"];
  const VALID_SHIFT_FUNCTIONS = ["K", "R"];

  function isValidEntry(entry: {
    userId: number;
    date: string;
    shiftType: string;
    shiftFunction: string;
  }, year: number, month: number, daysInMonth: number) {
    const datePrefix = `${year}-${String(month).padStart(2, "0")}-`;
    const day = Number(entry.date.slice(8, 10));
    return (
      Number.isInteger(entry.userId) &&
      entry.date.startsWith(datePrefix) &&
      Number.isInteger(day) &&
      day >= 1 &&
      day <= daysInMonth &&
      VALID_SHIFT_TYPES.includes(entry.shiftType) &&
      VALID_SHIFT_FUNCTIONS.includes(entry.shiftFunction)
    );
  }

  it("accepts valid entry", () => {
    expect(isValidEntry(
      { userId: 1, date: "2026-08-15", shiftType: "D", shiftFunction: "K" },
      2026, 8, 31
    )).toBe(true);
  });

  it("rejects entry with wrong month prefix", () => {
    expect(isValidEntry(
      { userId: 1, date: "2026-07-15", shiftType: "D", shiftFunction: "K" },
      2026, 8, 31
    )).toBe(false);
  });

  it("rejects entry with day exceeding month length", () => {
    expect(isValidEntry(
      { userId: 1, date: "2026-02-30", shiftType: "D", shiftFunction: "K" },
      2026, 2, 28
    )).toBe(false);
  });

  it("rejects entry with day 0", () => {
    expect(isValidEntry(
      { userId: 1, date: "2026-08-00", shiftType: "D", shiftFunction: "K" },
      2026, 8, 31
    )).toBe(false);
  });

  it("rejects invalid shift type", () => {
    expect(isValidEntry(
      { userId: 1, date: "2026-08-15", shiftType: "X", shiftFunction: "K" },
      2026, 8, 31
    )).toBe(false);
  });

  it("rejects invalid shift function", () => {
    expect(isValidEntry(
      { userId: 1, date: "2026-08-15", shiftType: "D", shiftFunction: "X" },
      2026, 8, 31
    )).toBe(false);
  });

  it("accepts all valid shift type and function combinations", () => {
    for (const st of VALID_SHIFT_TYPES) {
      for (const sf of VALID_SHIFT_FUNCTIONS) {
        expect(isValidEntry(
          { userId: 1, date: "2026-08-15", shiftType: st, shiftFunction: sf },
          2026, 8, 31
        )).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Duplicate assignment detection (from schedule/route.ts POST)
// ---------------------------------------------------------------------------

describe("Duplicate assignment detection", () => {
  function hasDuplicates(entries: { userId: number; date: string }[]) {
    const seen = new Set<string>();
    for (const entry of entries) {
      const key = `${entry.userId}:${entry.date}`;
      if (seen.has(key)) return true;
      seen.add(key);
    }
    return false;
  }

  it("returns false for unique entries", () => {
    expect(hasDuplicates([
      { userId: 1, date: "2026-08-01" },
      { userId: 1, date: "2026-08-02" },
      { userId: 2, date: "2026-08-01" },
    ])).toBe(false);
  });

  it("returns true for duplicate user+date", () => {
    expect(hasDuplicates([
      { userId: 1, date: "2026-08-01" },
      { userId: 1, date: "2026-08-01" },
    ])).toBe(true);
  });

  it("different users on same date are not duplicates", () => {
    expect(hasDuplicates([
      { userId: 1, date: "2026-08-01" },
      { userId: 2, date: "2026-08-01" },
    ])).toBe(false);
  });

  it("same user on different dates are not duplicates", () => {
    expect(hasDuplicates([
      { userId: 1, date: "2026-08-01" },
      { userId: 1, date: "2026-08-02" },
    ])).toBe(false);
  });

  it("returns false for empty array", () => {
    expect(hasDuplicates([])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Proposal status validation (from admin/proposals PATCH)
// ---------------------------------------------------------------------------

describe("Proposal status validation", () => {
  const VALID_STATUSES = ["approved", "rejected", "submitted"];

  it("accepts valid statuses", () => {
    for (const status of VALID_STATUSES) {
      expect(VALID_STATUSES.includes(status)).toBe(true);
    }
  });

  it("rejects draft status for admin updates", () => {
    expect(VALID_STATUSES.includes("draft")).toBe(false);
  });

  it("rejects arbitrary strings", () => {
    expect(VALID_STATUSES.includes("pending")).toBe(false);
    expect(VALID_STATUSES.includes("")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Proposal hours calculation (from admin/proposals GET)
// ---------------------------------------------------------------------------

describe("Proposal hours calculation", () => {
  function calculateProposalHours(entries: { shift: string }[]) {
    return entries.reduce(
      (total, entry) => total + (entry.shift.startsWith("DN") ? 24 : 12),
      0
    );
  }

  it("returns 0 for empty entries", () => {
    expect(calculateProposalHours([])).toBe(0);
  });

  it("calculates 12h for D shift", () => {
    expect(calculateProposalHours([{ shift: "D" }])).toBe(12);
  });

  it("calculates 12h for N shift", () => {
    expect(calculateProposalHours([{ shift: "N" }])).toBe(12);
  });

  it("calculates 24h for DN shift", () => {
    expect(calculateProposalHours([{ shift: "DN" }])).toBe(24);
  });

  it("sums mixed shifts correctly", () => {
    const entries = [
      { shift: "D" },
      { shift: "N" },
      { shift: "DN" },
      { shift: "D" },
    ];
    expect(calculateProposalHours(entries)).toBe(60); // 12+12+24+12
  });
});

// ---------------------------------------------------------------------------
// Hours limit enforcement (from schedule/route.ts POST)
// ---------------------------------------------------------------------------

describe("Hours limit enforcement", () => {
  function getHoursViolations(
    members: { id: number; minHours: number; maxHours: number }[],
    hoursMap: Map<number, number>
  ) {
    const overLimit: number[] = [];
    const underLimit: number[] = [];
    for (const member of members) {
      const hours = hoursMap.get(member.id) ?? 0;
      if (hours > member.maxHours) overLimit.push(member.id);
      if (hours < member.minHours) underLimit.push(member.id);
    }
    return { overLimit, underLimit };
  }

  it("detects over-limit members", () => {
    const members = [{ id: 1, minHours: 120, maxHours: 180 }];
    const hours = new Map([[1, 200]]);
    const result = getHoursViolations(members, hours);
    expect(result.overLimit).toEqual([1]);
    expect(result.underLimit).toEqual([]);
  });

  it("detects under-limit members", () => {
    const members = [{ id: 1, minHours: 120, maxHours: 180 }];
    const hours = new Map([[1, 100]]);
    const result = getHoursViolations(members, hours);
    expect(result.overLimit).toEqual([]);
    expect(result.underLimit).toEqual([1]);
  });

  it("passes members within range", () => {
    const members = [{ id: 1, minHours: 120, maxHours: 180 }];
    const hours = new Map([[1, 150]]);
    const result = getHoursViolations(members, hours);
    expect(result.overLimit).toEqual([]);
    expect(result.underLimit).toEqual([]);
  });

  it("treats missing hours as 0 (under limit)", () => {
    const members = [{ id: 1, minHours: 120, maxHours: 180 }];
    const hours = new Map<number, number>();
    const result = getHoursViolations(members, hours);
    expect(result.underLimit).toEqual([1]);
  });
});
