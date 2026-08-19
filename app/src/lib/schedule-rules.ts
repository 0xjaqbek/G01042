export const SHIFT_CODES = ["D-K", "D-R", "N-K", "N-R", "DN-K", "DN-R"] as const;

export type ShiftCode = (typeof SHIFT_CODES)[number];
export type ShiftType = "D" | "N" | "DN";
export type ShiftFunction = "K" | "R";

export interface ScheduleDraftEntry {
  userId: number;
  date: string;
  shiftType: ShiftType;
  shiftFunction: ShiftFunction;
}

export interface TeamMember {
  id: number;
  name: string;
  role: "kierowca" | "ratownik";
}

const HOURS_LIMITS: Record<string, { min: number; max: number }> = {
  "reszczynski lukasz": { min: 180, max: 240 },
  "ceplin waldemar": { min: 120, max: 180 },
  "martyna pawel": { min: 120, max: 120 },
  "michniewicz tomasz": { min: 120, max: 120 },
  "porzezinski mateusz": { min: 180, max: 240 },
  "roginski tomasz": { min: 120, max: 120 },
  "szarynski tomasz": { min: 120, max: 180 },
  "szymanski tomasz": { min: 120, max: 180 },
  "tekien marek": { min: 120, max: 120 },
  "turzynski krystian": { min: 120, max: 180 },
};

export function getHoursLimit(name: string) {
  const key = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  return HOURS_LIMITS[key] ?? { min: 120, max: 240 };
}

export function toShiftCode(entry: Pick<ScheduleDraftEntry, "shiftType" | "shiftFunction">): ShiftCode {
  return `${entry.shiftType}-${entry.shiftFunction}` as ShiftCode;
}

export function splitShiftCode(code: ShiftCode) {
  const [shiftType, shiftFunction] = code.split("-") as [ShiftType, ShiftFunction];
  return { shiftType, shiftFunction };
}

export function shiftHours(shiftType: ShiftType) {
  return shiftType === "DN" ? 24 : 12;
}

export function getCoverage(entries: ScheduleDraftEntry[], date: string) {
  const dayEntries = entries.filter((entry) => entry.date === date);
  return {
    dayK: dayEntries.filter((entry) => entry.shiftFunction === "K" && (entry.shiftType === "D" || entry.shiftType === "DN")).length,
    dayR: dayEntries.filter((entry) => entry.shiftFunction === "R" && (entry.shiftType === "D" || entry.shiftType === "DN")).length,
    nightK: dayEntries.filter((entry) => entry.shiftFunction === "K" && (entry.shiftType === "N" || entry.shiftType === "DN")).length,
    nightR: dayEntries.filter((entry) => entry.shiftFunction === "R" && (entry.shiftType === "N" || entry.shiftType === "DN")).length,
  };
}

export function getMemberHours(entries: ScheduleDraftEntry[], userId: number) {
  return entries
    .filter((entry) => entry.userId === userId)
    .reduce((total, entry) => total + shiftHours(entry.shiftType), 0);
}

export function getCoverageIssueDates(entries: ScheduleDraftEntry[], year: number, month: number) {
  const days = new Date(year, month, 0).getDate();
  const issues: number[] = [];
  for (let day = 1; day <= days; day += 1) {
    const coverage = getCoverage(entries, formatDate(year, month, day));
    if (Object.values(coverage).some((count) => count !== 1)) issues.push(day);
  }
  return issues;
}

export function getRestConflicts(entries: ScheduleDraftEntry[]) {
  const byMember = new Map<number, ScheduleDraftEntry[]>();
  for (const entry of entries) {
    const current = byMember.get(entry.userId) ?? [];
    current.push(entry);
    byMember.set(entry.userId, current);
  }

  const conflicts: { userId: number; firstDate: string; secondDate: string }[] = [];
  for (const [userId, memberEntries] of byMember) {
    const sorted = [...memberEntries].sort((a, b) => a.date.localeCompare(b.date));
    for (let index = 0; index < sorted.length - 1; index += 1) {
      const current = sorted[index];
      const next = sorted[index + 1];
      if (daysBetween(current.date, next.date) !== 1) continue;
      const conflict =
        (current.shiftType === "DN" && (next.shiftType === "D" || next.shiftType === "DN")) ||
        (current.shiftType === "N" && next.shiftType === "DN");
      if (conflict) conflicts.push({ userId, firstDate: current.date, secondDate: next.date });
    }
  }
  return conflicts;
}

export function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function daysBetween(first: string, second: string) {
  const firstDate = new Date(`${first}T00:00:00Z`);
  const secondDate = new Date(`${second}T00:00:00Z`);
  return Math.round((secondDate.getTime() - firstDate.getTime()) / 86_400_000);
}
