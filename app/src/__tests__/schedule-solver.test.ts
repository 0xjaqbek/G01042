import { describe, it, expect } from "vitest";
import {
  analyzeProposalDemand,
  getFairnessStats,
  type ProposalInput,
} from "@/lib/schedule-solver";
import {
  type TeamMember,
  type ScheduleDraftEntry,
  formatDate,
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

const testTeam: TeamMember[] = [
  { id: 1, name: "Kowalski", role: "kierowca", minHours: 120, maxHours: 240 },
  { id: 2, name: "Nowak", role: "ratownik", minHours: 120, maxHours: 240 },
  { id: 3, name: "Wiśniewski", role: "kierowca", minHours: 160, maxHours: 240 },
  { id: 4, name: "Wójcik", role: "ratownik", minHours: 160, maxHours: 240 },
  { id: 5, name: "Kamiński", role: "oba", minHours: 120, maxHours: 240 },
];

// ---------------------------------------------------------------------------
// analyzeProposalDemand
// ---------------------------------------------------------------------------

describe("analyzeProposalDemand", () => {
  it("returns one entry per day in the month", () => {
    const result = analyzeProposalDemand([], testTeam, 2026, 8);
    expect(result).toHaveLength(31);
  });

  it("returns 28 entries for February", () => {
    const result = analyzeProposalDemand([], testTeam, 2026, 2);
    expect(result).toHaveLength(28);
  });

  it("counts proposals for a day", () => {
    const proposals: ProposalInput[] = [
      { userId: 1, entries: [{ day: 5, shift: "D" }] },
      { userId: 3, entries: [{ day: 5, shift: "N" }] },
    ];
    const result = analyzeProposalDemand(proposals, testTeam, 2026, 8);
    const day5 = result.find((d) => d.day === 5)!;
    expect(day5.total).toBe(2);
    expect(day5.dayK).toEqual([1]);
    expect(day5.nightK).toEqual([3]);
  });

  it("maps oba members to both K and R slots", () => {
    const proposals: ProposalInput[] = [
      { userId: 5, entries: [{ day: 1, shift: "D" }] },
    ];
    const result = analyzeProposalDemand(proposals, testTeam, 2026, 8);
    const day1 = result.find((d) => d.day === 1)!;
    expect(day1.dayK).toContain(5);
    expect(day1.dayR).toContain(5);
  });

  it("maps DN proposals to both day and night", () => {
    const proposals: ProposalInput[] = [
      { userId: 1, entries: [{ day: 10, shift: "DN" }] },
    ];
    const result = analyzeProposalDemand(proposals, testTeam, 2026, 8);
    const day10 = result.find((d) => d.day === 10)!;
    expect(day10.dayK).toEqual([1]);
    expect(day10.nightK).toEqual([1]);
    expect(day10.dayR).toEqual([]);
  });

  it("returns empty arrays for days with no proposals", () => {
    const result = analyzeProposalDemand([], testTeam, 2026, 8);
    const day1 = result[0];
    expect(day1.total).toBe(0);
    expect(day1.dayK).toEqual([]);
    expect(day1.dayR).toEqual([]);
    expect(day1.nightK).toEqual([]);
    expect(day1.nightR).toEqual([]);
  });

  it("ignores proposals from unknown users", () => {
    const proposals: ProposalInput[] = [
      { userId: 999, entries: [{ day: 1, shift: "D" }] },
    ];
    const result = analyzeProposalDemand(proposals, testTeam, 2026, 8);
    expect(result[0].total).toBe(0);
  });

  it("detects over-demand (multiple kierowcas same day-slot)", () => {
    const proposals: ProposalInput[] = [
      { userId: 1, entries: [{ day: 5, shift: "D" }] },
      { userId: 3, entries: [{ day: 5, shift: "D" }] },
    ];
    const result = analyzeProposalDemand(proposals, testTeam, 2026, 8);
    const day5 = result.find((d) => d.day === 5)!;
    expect(day5.dayK).toEqual([1, 3]);
    expect(day5.dayK.length).toBeGreaterThan(1);
  });
});

// ---------------------------------------------------------------------------
// getFairnessStats
// ---------------------------------------------------------------------------

describe("getFairnessStats", () => {
  it("returns one entry per team member", () => {
    const result = getFairnessStats(testTeam, []);
    expect(result).toHaveLength(testTeam.length);
  });

  it("calculates loadRatio as hours / minHours", () => {
    const entries = [entry(1, "2026-08-01", "D", "K")]; // 12h
    const result = getFairnessStats(testTeam, entries);
    const m1 = result.find((m) => m.id === 1)!;
    expect(m1.hours).toBe(12);
    expect(m1.loadRatio).toBeCloseTo(12 / 120);
  });

  it("counts night shifts (N and DN)", () => {
    const entries = [
      entry(1, "2026-08-01", "N", "K"),
      entry(1, "2026-08-03", "DN", "K"),
      entry(1, "2026-08-05", "D", "K"),
    ];
    const result = getFairnessStats(testTeam, entries);
    const m1 = result.find((m) => m.id === 1)!;
    expect(m1.nightCount).toBe(2);
    expect(m1.nightShare).toBeCloseTo(2 / 3);
  });

  it("counts weekend shifts (Sat/Sun)", () => {
    // 2026-08-01 is Saturday, 2026-08-02 is Sunday, 2026-08-03 is Monday
    const entries = [
      entry(1, "2026-08-01", "D", "K"),
      entry(1, "2026-08-02", "D", "K"),
      entry(1, "2026-08-03", "D", "K"),
    ];
    const result = getFairnessStats(testTeam, entries);
    const m1 = result.find((m) => m.id === 1)!;
    expect(m1.weekendCount).toBe(2);
    expect(m1.weekendShare).toBeCloseTo(2 / 3);
  });

  it("counts DN shifts", () => {
    const entries = [
      entry(1, "2026-08-01", "DN", "K"),
      entry(1, "2026-08-03", "DN", "K"),
      entry(1, "2026-08-05", "D", "K"),
    ];
    const result = getFairnessStats(testTeam, entries);
    expect(result.find((m) => m.id === 1)!.dnCount).toBe(2);
  });

  it("handles members with no entries", () => {
    const result = getFairnessStats(testTeam, []);
    const m1 = result.find((m) => m.id === 1)!;
    expect(m1.hours).toBe(0);
    expect(m1.loadRatio).toBe(0);
    expect(m1.nightShare).toBe(0);
    expect(m1.weekendShare).toBe(0);
    expect(m1.shiftCount).toBe(0);
  });

  it("proportional fairness: different ratios for different minHours", () => {
    // Member 1: min 120h, 60h assigned → ratio 0.5
    // Member 3: min 160h, 60h assigned → ratio 0.375
    const entries = [
      ...Array.from({ length: 5 }, (_, i) =>
        entry(1, formatDate(2026, 8, i + 1), "D", "K")
      ),
      ...Array.from({ length: 5 }, (_, i) =>
        entry(3, formatDate(2026, 8, i + 10), "D", "K")
      ),
    ];
    const result = getFairnessStats(testTeam, entries);
    const m1 = result.find((m) => m.id === 1)!;
    const m3 = result.find((m) => m.id === 3)!;
    expect(m1.loadRatio).toBeCloseTo(60 / 120);
    expect(m3.loadRatio).toBeCloseTo(60 / 160);
    expect(m3.loadRatio).toBeLessThan(m1.loadRatio);
  });
});
