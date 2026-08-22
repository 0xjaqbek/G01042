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

// ─── Fairness Statistics ───

export function getFairnessStats(
  team: TeamMember[],
  entries: ScheduleDraftEntry[]
): MemberFairness[] {
  return team.map((member) => {
    const own = entries.filter((e) => e.userId === member.id);
    const hours = getMemberHours(entries, member.id);
    const shiftCount = own.length;
    const nightCount = own.filter(
      (e) => e.shiftType === "N" || e.shiftType === "DN"
    ).length;
    const dnCount = own.filter((e) => e.shiftType === "DN").length;
    const weekendCount = own.filter((e) => {
      const dow = new Date(`${e.date}T12:00:00Z`).getUTCDay();
      return dow === 0 || dow === 6;
    }).length;

    const minH = member.minHours ?? 120;
    const maxH = member.maxHours ?? 240;

    return {
      id: member.id,
      name: member.name,
      hours,
      minHours: minH,
      maxHours: maxH,
      shiftCount,
      nightCount,
      weekendCount,
      dnCount,
      loadRatio: minH > 0 ? hours / minH : 0,
      nightShare: shiftCount > 0 ? nightCount / shiftCount : 0,
      weekendShare: shiftCount > 0 ? weekendCount / shiftCount : 0,
    };
  });
}

// ─── Suggestion Engine ───

export function suggestAssignments(
  team: TeamMember[],
  currentDraft: ScheduleDraftEntry[],
  year: number,
  month: number
): ScheduleDraftEntry[] {
  const working = [...currentDraft];
  const suggestions: ScheduleDraftEntry[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = formatDate(year, month, day);

    for (const [st, sf] of [
      ["D", "K"],
      ["D", "R"],
      ["N", "K"],
      ["N", "R"],
    ] as [ShiftType, ShiftFunction][]) {
      const cov = getCoverage(working, date);
      const count =
        st === "D"
          ? sf === "K"
            ? cov.dayK
            : cov.dayR
          : sf === "K"
            ? cov.nightK
            : cov.nightR;
      if (count >= 1) continue;

      const best = pickCandidate(team, working, date, st, sf);
      if (best) {
        const s: ScheduleDraftEntry = {
          userId: best.id,
          date,
          shiftType: st,
          shiftFunction: sf,
        };
        working.push(s);
        suggestions.push(s);
      }
    }
  }

  return suggestions;
}

function pickCandidate(
  team: TeamMember[],
  working: ScheduleDraftEntry[],
  date: string,
  shiftType: ShiftType,
  shiftFunction: ShiftFunction
): TeamMember | null {
  const eligible = team.filter((member) => {
    if (member.role === "kierowca" && shiftFunction !== "K") return false;
    if (member.role === "ratownik" && shiftFunction !== "R") return false;
    if (working.some((e) => e.userId === member.id && e.date === date))
      return false;
    if (wouldCreateRestConflict(working, member.id, date, shiftType))
      return false;
    const hours = getMemberHours(working, member.id);
    if (hours + shiftHours(shiftType) > (member.maxHours ?? 240)) return false;
    return true;
  });

  if (eligible.length === 0) return null;

  const scored = eligible.map((member) => {
    const hours = getMemberHours(working, member.id);
    const minH = member.minHours ?? 120;
    const loadRatio = minH > 0 ? hours / minH : 0;

    let fnPenalty = 0;
    if (member.role === "oba") {
      const kCount = working.filter(
        (e) => e.userId === member.id && e.shiftFunction === "K"
      ).length;
      const rCount = working.filter(
        (e) => e.userId === member.id && e.shiftFunction === "R"
      ).length;
      fnPenalty = shiftFunction === "K" ? kCount - rCount : rCount - kCount;
    }

    return { member, loadRatio, fnPenalty };
  });

  scored.sort((a, b) => {
    if (a.loadRatio !== b.loadRatio) return a.loadRatio - b.loadRatio;
    return a.fnPenalty - b.fnPenalty;
  });

  return scored[0].member;
}
