import { describe, it, expect } from "vitest";
import {
  SHIFT_CODES,
  toShiftCode,
  splitShiftCode,
  shiftHours,
  getCoverage,
  getMemberHours,
  getCoverageIssueDates,
  getRestConflicts,
  formatDate,
  getAllowedShiftCodes,
  getHoursLimit,
  isConflictPair,
  addDays,
  wouldCreateRestConflict,
  type ScheduleDraftEntry,
  type ShiftCode,
} from "@/lib/schedule-rules";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function entry(
  userId: number,
  date: string,
  shiftType: "D" | "N" | "DN",
  shiftFunction: "K" | "R"
): ScheduleDraftEntry {
  return { userId, date, shiftType, shiftFunction };
}

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------

describe("formatDate", () => {
  it("pads single-digit month and day", () => {
    expect(formatDate(2026, 1, 5)).toBe("2026-01-05");
  });

  it("handles double-digit month and day", () => {
    expect(formatDate(2026, 12, 25)).toBe("2026-12-25");
  });

  it("handles month boundaries", () => {
    expect(formatDate(2026, 2, 28)).toBe("2026-02-28");
  });
});

// ---------------------------------------------------------------------------
// shiftHours
// ---------------------------------------------------------------------------

describe("shiftHours", () => {
  it("returns 12 for day shift", () => {
    expect(shiftHours("D")).toBe(12);
  });

  it("returns 12 for night shift", () => {
    expect(shiftHours("N")).toBe(12);
  });

  it("returns 24 for full-day shift", () => {
    expect(shiftHours("DN")).toBe(24);
  });
});

// ---------------------------------------------------------------------------
// toShiftCode / splitShiftCode
// ---------------------------------------------------------------------------

describe("toShiftCode", () => {
  it("combines shiftType and shiftFunction", () => {
    expect(toShiftCode({ shiftType: "D", shiftFunction: "K" })).toBe("D-K");
    expect(toShiftCode({ shiftType: "N", shiftFunction: "R" })).toBe("N-R");
    expect(toShiftCode({ shiftType: "DN", shiftFunction: "K" })).toBe("DN-K");
  });
});

describe("splitShiftCode", () => {
  it("splits code into type and function", () => {
    expect(splitShiftCode("D-K")).toEqual({ shiftType: "D", shiftFunction: "K" });
    expect(splitShiftCode("N-R")).toEqual({ shiftType: "N", shiftFunction: "R" });
    expect(splitShiftCode("DN-K")).toEqual({ shiftType: "DN", shiftFunction: "K" });
  });

  it("round-trips with toShiftCode for every valid code", () => {
    for (const code of SHIFT_CODES) {
      const parts = splitShiftCode(code);
      expect(toShiftCode(parts)).toBe(code);
    }
  });
});

// ---------------------------------------------------------------------------
// getHoursLimit
// ---------------------------------------------------------------------------

describe("getHoursLimit", () => {
  it("returns the limits passed in", () => {
    expect(getHoursLimit("Anyone", { min: 100, max: 200 })).toEqual({ min: 100, max: 200 });
  });

  it("returns default limits when no override provided", () => {
    expect(getHoursLimit("Anyone")).toEqual({ min: 120, max: 240 });
  });
});

// ---------------------------------------------------------------------------
// getAllowedShiftCodes
// ---------------------------------------------------------------------------

describe("getAllowedShiftCodes", () => {
  it("returns only K-function codes for kierowca", () => {
    const codes = getAllowedShiftCodes("kierowca");
    expect(codes).toEqual(["D-K", "N-K", "DN-K"]);
    expect(codes.every((c) => c.endsWith("-K"))).toBe(true);
  });

  it("returns only R-function codes for ratownik", () => {
    const codes = getAllowedShiftCodes("ratownik");
    expect(codes).toEqual(["D-R", "N-R", "DN-R"]);
    expect(codes.every((c) => c.endsWith("-R"))).toBe(true);
  });

  it("returns all codes for oba", () => {
    const codes = getAllowedShiftCodes("oba");
    expect(codes).toEqual(SHIFT_CODES);
    expect(codes).toHaveLength(6);
  });
});

// ---------------------------------------------------------------------------
// getCoverage
// ---------------------------------------------------------------------------

describe("getCoverage", () => {
  it("returns zeros when no entries for a date", () => {
    const coverage = getCoverage([], "2026-08-01");
    expect(coverage).toEqual({ dayK: 0, dayR: 0, nightK: 0, nightR: 0 });
  });

  it("counts day shift driver correctly", () => {
    const entries = [entry(1, "2026-08-01", "D", "K")];
    const coverage = getCoverage(entries, "2026-08-01");
    expect(coverage.dayK).toBe(1);
    expect(coverage.nightK).toBe(0);
  });

  it("counts DN shift as both day and night", () => {
    const entries = [entry(1, "2026-08-01", "DN", "R")];
    const coverage = getCoverage(entries, "2026-08-01");
    expect(coverage.dayR).toBe(1);
    expect(coverage.nightR).toBe(1);
    expect(coverage.dayK).toBe(0);
    expect(coverage.nightK).toBe(0);
  });

  it("handles full correct coverage for a day", () => {
    const entries = [
      entry(1, "2026-08-01", "D", "K"),
      entry(2, "2026-08-01", "D", "R"),
      entry(3, "2026-08-01", "N", "K"),
      entry(4, "2026-08-01", "N", "R"),
    ];
    const coverage = getCoverage(entries, "2026-08-01");
    expect(coverage).toEqual({ dayK: 1, dayR: 1, nightK: 1, nightR: 1 });
  });

  it("ignores entries from other dates", () => {
    const entries = [
      entry(1, "2026-08-01", "D", "K"),
      entry(2, "2026-08-02", "D", "K"),
    ];
    const coverage = getCoverage(entries, "2026-08-01");
    expect(coverage.dayK).toBe(1);
  });

  it("detects over-coverage (multiple drivers on same slot)", () => {
    const entries = [
      entry(1, "2026-08-01", "D", "K"),
      entry(2, "2026-08-01", "D", "K"),
    ];
    const coverage = getCoverage(entries, "2026-08-01");
    expect(coverage.dayK).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// getMemberHours
// ---------------------------------------------------------------------------

describe("getMemberHours", () => {
  it("returns 0 for a member with no entries", () => {
    expect(getMemberHours([], 1)).toBe(0);
  });

  it("sums 12h shifts correctly", () => {
    const entries = [
      entry(1, "2026-08-01", "D", "K"),
      entry(1, "2026-08-02", "N", "K"),
    ];
    expect(getMemberHours(entries, 1)).toBe(24);
  });

  it("sums 24h shifts correctly", () => {
    const entries = [entry(1, "2026-08-01", "DN", "K")];
    expect(getMemberHours(entries, 1)).toBe(24);
  });

  it("ignores other members' entries", () => {
    const entries = [
      entry(1, "2026-08-01", "DN", "K"),
      entry(2, "2026-08-02", "D", "R"),
    ];
    expect(getMemberHours(entries, 1)).toBe(24);
    expect(getMemberHours(entries, 2)).toBe(12);
  });

  it("handles a full month schedule", () => {
    // 10 day shifts = 120h
    const entries = Array.from({ length: 10 }, (_, i) =>
      entry(1, `2026-08-${String(i + 1).padStart(2, "0")}`, "D", "K")
    );
    expect(getMemberHours(entries, 1)).toBe(120);
  });
});

// ---------------------------------------------------------------------------
// getCoverageIssueDates
// ---------------------------------------------------------------------------

describe("getCoverageIssueDates", () => {
  it("returns all days when schedule is empty", () => {
    const issues = getCoverageIssueDates([], 2026, 8);
    // August has 31 days — all should be flagged
    expect(issues).toHaveLength(31);
    expect(issues[0]).toBe(1);
    expect(issues[30]).toBe(31);
  });

  it("returns empty array when every day is perfectly covered", () => {
    // Build a full month coverage: each day has D-K, D-R, N-K, N-R
    const entries: ScheduleDraftEntry[] = [];
    for (let day = 1; day <= 31; day++) {
      const date = formatDate(2026, 8, day);
      entries.push(entry(1, date, "D", "K"));
      entries.push(entry(2, date, "D", "R"));
      entries.push(entry(3, date, "N", "K"));
      entries.push(entry(4, date, "N", "R"));
    }
    const issues = getCoverageIssueDates(entries, 2026, 8);
    expect(issues).toEqual([]);
  });

  it("flags days with missing coverage", () => {
    // Cover all but day 15
    const entries: ScheduleDraftEntry[] = [];
    for (let day = 1; day <= 31; day++) {
      if (day === 15) continue;
      const date = formatDate(2026, 8, day);
      entries.push(entry(1, date, "D", "K"));
      entries.push(entry(2, date, "D", "R"));
      entries.push(entry(3, date, "N", "K"));
      entries.push(entry(4, date, "N", "R"));
    }
    const issues = getCoverageIssueDates(entries, 2026, 8);
    expect(issues).toEqual([15]);
  });

  it("flags days with over-coverage", () => {
    const entries: ScheduleDraftEntry[] = [];
    for (let day = 1; day <= 31; day++) {
      const date = formatDate(2026, 8, day);
      entries.push(entry(1, date, "D", "K"));
      entries.push(entry(2, date, "D", "R"));
      entries.push(entry(3, date, "N", "K"));
      entries.push(entry(4, date, "N", "R"));
    }
    // Add an extra driver on day 10
    entries.push(entry(5, formatDate(2026, 8, 10), "D", "K"));
    const issues = getCoverageIssueDates(entries, 2026, 8);
    expect(issues).toEqual([10]);
  });

  it("uses correct number of days for February (non-leap)", () => {
    const issues = getCoverageIssueDates([], 2026, 2);
    expect(issues).toHaveLength(28);
  });

  it("uses correct number of days for February (leap year)", () => {
    const issues = getCoverageIssueDates([], 2028, 2);
    expect(issues).toHaveLength(29);
  });

  it("counts DN shifts as covering both day and night", () => {
    const entries: ScheduleDraftEntry[] = [];
    for (let day = 1; day <= 31; day++) {
      const date = formatDate(2026, 8, day);
      // DN covers both day and night for K and R
      entries.push(entry(1, date, "DN", "K"));
      entries.push(entry(2, date, "DN", "R"));
    }
    const issues = getCoverageIssueDates(entries, 2026, 8);
    expect(issues).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getRestConflicts
// ---------------------------------------------------------------------------

describe("getRestConflicts", () => {
  it("returns empty array when no entries", () => {
    expect(getRestConflicts([])).toEqual([]);
  });

  it("allows D followed by D (no conflict)", () => {
    const entries = [
      entry(1, "2026-08-01", "D", "K"),
      entry(1, "2026-08-02", "D", "K"),
    ];
    expect(getRestConflicts(entries)).toEqual([]);
  });

  it("allows D followed by N (no conflict)", () => {
    const entries = [
      entry(1, "2026-08-01", "D", "K"),
      entry(1, "2026-08-02", "N", "K"),
    ];
    expect(getRestConflicts(entries)).toEqual([]);
  });

  it("allows N followed by D (no conflict)", () => {
    const entries = [
      entry(1, "2026-08-01", "N", "K"),
      entry(1, "2026-08-02", "D", "K"),
    ];
    expect(getRestConflicts(entries)).toEqual([]);
  });

  it("allows N followed by N (no conflict)", () => {
    const entries = [
      entry(1, "2026-08-01", "N", "K"),
      entry(1, "2026-08-02", "N", "K"),
    ];
    expect(getRestConflicts(entries)).toEqual([]);
  });

  it("detects DN followed by D as conflict", () => {
    const entries = [
      entry(1, "2026-08-01", "DN", "K"),
      entry(1, "2026-08-02", "D", "K"),
    ];
    const conflicts = getRestConflicts(entries);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toEqual({
      userId: 1,
      firstDate: "2026-08-01",
      secondDate: "2026-08-02",
    });
  });

  it("detects DN followed by DN as conflict", () => {
    const entries = [
      entry(1, "2026-08-01", "DN", "K"),
      entry(1, "2026-08-02", "DN", "K"),
    ];
    const conflicts = getRestConflicts(entries);
    expect(conflicts).toHaveLength(1);
  });

  it("detects N followed by DN as conflict", () => {
    const entries = [
      entry(1, "2026-08-01", "N", "K"),
      entry(1, "2026-08-02", "DN", "K"),
    ];
    const conflicts = getRestConflicts(entries);
    expect(conflicts).toHaveLength(1);
  });

  it("does NOT flag DN followed by N (person rests during the day)", () => {
    const entries = [
      entry(1, "2026-08-01", "DN", "K"),
      entry(1, "2026-08-02", "N", "K"),
    ];
    // DN → N: the person works 24h, then rests the full next day, then works night
    // According to the code, this is NOT a conflict (DN+N is not in the conflict conditions)
    const conflicts = getRestConflicts(entries);
    expect(conflicts).toEqual([]);
  });

  it("ignores non-consecutive days", () => {
    const entries = [
      entry(1, "2026-08-01", "DN", "K"),
      entry(1, "2026-08-03", "DN", "K"), // gap of 1 day
    ];
    expect(getRestConflicts(entries)).toEqual([]);
  });

  it("handles multiple members independently", () => {
    const entries = [
      entry(1, "2026-08-01", "DN", "K"),
      entry(1, "2026-08-02", "D", "K"),   // conflict for user 1
      entry(2, "2026-08-01", "D", "R"),
      entry(2, "2026-08-02", "D", "R"),   // no conflict for user 2
    ];
    const conflicts = getRestConflicts(entries);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].userId).toBe(1);
  });

  it("detects multiple conflicts for one member", () => {
    const entries = [
      entry(1, "2026-08-01", "DN", "K"),
      entry(1, "2026-08-02", "DN", "K"),  // conflict 1
      entry(1, "2026-08-03", "D", "K"),   // conflict 2 (DN→D)
    ];
    const conflicts = getRestConflicts(entries);
    expect(conflicts).toHaveLength(2);
  });

  it("handles unsorted entries correctly", () => {
    const entries = [
      entry(1, "2026-08-02", "D", "K"),
      entry(1, "2026-08-01", "DN", "K"),  // out of order
    ];
    const conflicts = getRestConflicts(entries);
    expect(conflicts).toHaveLength(1);
  });

  it("handles month boundary conflicts", () => {
    const entries = [
      entry(1, "2026-08-31", "DN", "K"),
      entry(1, "2026-09-01", "D", "K"),
    ];
    const conflicts = getRestConflicts(entries);
    expect(conflicts).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// SHIFT_CODES constant
// ---------------------------------------------------------------------------

describe("SHIFT_CODES", () => {
  it("contains exactly 6 valid codes", () => {
    expect(SHIFT_CODES).toHaveLength(6);
  });

  it("includes all combinations of D/N/DN with K/R", () => {
    expect(SHIFT_CODES).toContain("D-K");
    expect(SHIFT_CODES).toContain("D-R");
    expect(SHIFT_CODES).toContain("N-K");
    expect(SHIFT_CODES).toContain("N-R");
    expect(SHIFT_CODES).toContain("DN-K");
    expect(SHIFT_CODES).toContain("DN-R");
  });
});

// ---------------------------------------------------------------------------
// isConflictPair
// ---------------------------------------------------------------------------

describe("isConflictPair", () => {
  it("DN → D is a conflict", () => {
    expect(isConflictPair("DN", "D")).toBe(true);
  });

  it("DN → DN is a conflict", () => {
    expect(isConflictPair("DN", "DN")).toBe(true);
  });

  it("N → DN is a conflict", () => {
    expect(isConflictPair("N", "DN")).toBe(true);
  });

  it("DN → N is NOT a conflict", () => {
    expect(isConflictPair("DN", "N")).toBe(false);
  });

  it("D → D is NOT a conflict", () => {
    expect(isConflictPair("D", "D")).toBe(false);
  });

  it("D → N is NOT a conflict", () => {
    expect(isConflictPair("D", "N")).toBe(false);
  });

  it("N → D is NOT a conflict", () => {
    expect(isConflictPair("N", "D")).toBe(false);
  });

  it("N → N is NOT a conflict", () => {
    expect(isConflictPair("N", "N")).toBe(false);
  });

  it("D → DN is NOT a conflict", () => {
    expect(isConflictPair("D", "DN")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// addDays
// ---------------------------------------------------------------------------

describe("addDays", () => {
  it("adds 1 day", () => {
    expect(addDays("2026-08-15", 1)).toBe("2026-08-16");
  });

  it("subtracts 1 day", () => {
    expect(addDays("2026-08-15", -1)).toBe("2026-08-14");
  });

  it("crosses month boundary forward", () => {
    expect(addDays("2026-08-31", 1)).toBe("2026-09-01");
  });

  it("crosses month boundary backward", () => {
    expect(addDays("2026-09-01", -1)).toBe("2026-08-31");
  });

  it("crosses year boundary", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("handles zero days", () => {
    expect(addDays("2026-08-15", 0)).toBe("2026-08-15");
  });
});

// ---------------------------------------------------------------------------
// wouldCreateRestConflict
// ---------------------------------------------------------------------------

describe("wouldCreateRestConflict", () => {
  it("detects conflict with previous day DN → D", () => {
    const entries = [entry(1, "2026-08-14", "DN", "K")];
    expect(wouldCreateRestConflict(entries, 1, "2026-08-15", "D")).toBe(true);
  });

  it("detects conflict with next day DN → D (adding DN before existing D)", () => {
    const entries = [entry(1, "2026-08-16", "D", "K")];
    expect(wouldCreateRestConflict(entries, 1, "2026-08-15", "DN")).toBe(true);
  });

  it("allows D after D", () => {
    const entries = [entry(1, "2026-08-14", "D", "K")];
    expect(wouldCreateRestConflict(entries, 1, "2026-08-15", "D")).toBe(false);
  });

  it("allows N after DN (rest during day)", () => {
    const entries = [entry(1, "2026-08-14", "DN", "K")];
    expect(wouldCreateRestConflict(entries, 1, "2026-08-15", "N")).toBe(false);
  });

  it("ignores other users' entries", () => {
    const entries = [entry(2, "2026-08-14", "DN", "K")];
    expect(wouldCreateRestConflict(entries, 1, "2026-08-15", "D")).toBe(false);
  });

  it("ignores non-adjacent days", () => {
    const entries = [entry(1, "2026-08-13", "DN", "K")];
    expect(wouldCreateRestConflict(entries, 1, "2026-08-15", "D")).toBe(false);
  });

  it("checks both prev and next directions", () => {
    const entries = [
      entry(1, "2026-08-14", "D", "K"),
      entry(1, "2026-08-16", "DN", "K"),
    ];
    // N on 15th: prev D→N OK, but N→DN on next day is conflict
    expect(wouldCreateRestConflict(entries, 1, "2026-08-15", "N")).toBe(true);
  });
});
