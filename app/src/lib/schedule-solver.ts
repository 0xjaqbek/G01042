import {
  type ScheduleDraftEntry,
  type TeamMember,
  type ShiftType,
  type ShiftFunction,
  formatDate,
  getCoverage,
  getMemberHours,
  wouldCreateRestConflict,
  shiftHours,
} from "./schedule-rules";

// ─── Types ───

export interface ProposalInput {
  userId: number;
  entries: { day: number; shift: string }[];
}

export interface DayDemand {
  day: number;
  dayK: number[];
  dayR: number[];
  nightK: number[];
  nightR: number[];
  total: number;
}

export interface MemberFairness {
  id: number;
  name: string;
  hours: number;
  minHours: number;
  maxHours: number;
  shiftCount: number;
  nightCount: number;
  weekendCount: number;
  dnCount: number;
  loadRatio: number;
  nightShare: number;
  weekendShare: number;
}

// ─── Proposal Demand Analysis ───

export function analyzeProposalDemand(
  proposals: ProposalInput[],
  team: TeamMember[],
  year: number,
  month: number
): DayDemand[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const demands: DayDemand[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const d: DayDemand = { day, dayK: [], dayR: [], nightK: [], nightR: [], total: 0 };

    for (const p of proposals) {
      const member = team.find((m) => m.id === p.userId);
      if (!member) continue;

      const match = p.entries.find((e) => e.day === day);
      if (!match) continue;

      d.total++;
      const shift = match.shift as ShiftType;
      const canK = member.role === "kierowca" || member.role === "oba";
      const canR = member.role === "ratownik" || member.role === "oba";

      if (canK) {
        if (shift === "D" || shift === "DN") d.dayK.push(p.userId);
        if (shift === "N" || shift === "DN") d.nightK.push(p.userId);
      }
      if (canR) {
        if (shift === "D" || shift === "DN") d.dayR.push(p.userId);
        if (shift === "N" || shift === "DN") d.nightR.push(p.userId);
      }
    }

    demands.push(d);
  }

  return demands;
}
