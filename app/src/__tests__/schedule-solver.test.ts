import { describe, it, expect } from "vitest";
import {
  analyzeProposalDemand,
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
