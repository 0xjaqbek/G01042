import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { scheduleEntries, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import {
  getCoverageIssueDates,
  getHoursLimit,
  getMemberHours,
  getRestConflicts,
  type ScheduleDraftEntry,
  type ShiftFunction,
  type ShiftType,
} from "@/lib/schedule-rules";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));

  const entries = await db
    .select({
      id: scheduleEntries.id,
      userId: scheduleEntries.userId,
      userName: users.name,
      date: scheduleEntries.date,
      shiftType: scheduleEntries.shiftType,
      shiftFunction: scheduleEntries.shiftFunction,
    })
    .from(scheduleEntries)
    .innerJoin(users, eq(scheduleEntries.userId, users.id))
    .where(
      and(
        eq(scheduleEntries.year, year),
        eq(scheduleEntries.month, month)
      )
    );

  return NextResponse.json({ entries });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.isLeader) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const year = Number(body.year);
  const month = Number(body.month);
  const newEntries = body.entries;

  if (!Number.isInteger(year) || year < 2000 || !Number.isInteger(month) || month < 1 || month > 12 || !Array.isArray(newEntries)) {
    return NextResponse.json({ error: "Nieprawidłowe dane grafiku" }, { status: 400 });
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const datePrefix = `${year}-${String(month).padStart(2, "0")}-`;
  const normalizedEntries: ScheduleDraftEntry[] = [];
  const uniqueAssignments = new Set<string>();

  for (const entry of newEntries) {
    const userId = Number(entry?.userId);
    const date = String(entry?.date ?? "");
    const shiftType = entry?.shiftType as ShiftType;
    const shiftFunction = entry?.shiftFunction as ShiftFunction;
    const day = Number(date.slice(8, 10));
    const assignmentKey = `${userId}:${date}`;

    if (
      !Number.isInteger(userId) ||
      !date.startsWith(datePrefix) ||
      !Number.isInteger(day) ||
      day < 1 ||
      day > daysInMonth ||
      !["D", "N", "DN"].includes(shiftType) ||
      !["K", "R"].includes(shiftFunction) ||
      uniqueAssignments.has(assignmentKey)
    ) {
      return NextResponse.json({ error: "Grafik zawiera nieprawidłowy lub powielony dyżur" }, { status: 400 });
    }

    uniqueAssignments.add(assignmentKey);
    normalizedEntries.push({ userId, date, shiftType, shiftFunction });
  }

  const team = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.isActive, true));
  const teamIds = new Set(team.map((member) => member.id));

  if (normalizedEntries.some((entry) => !teamIds.has(entry.userId))) {
    return NextResponse.json({ error: "Grafik zawiera nieaktywnego pracownika" }, { status: 400 });
  }

  const coverageIssues = getCoverageIssueDates(normalizedEntries, year, month);
  const restConflicts = getRestConflicts(normalizedEntries);
  const overLimit = team.filter((member) => {
    const { max } = getHoursLimit(member.name);
    return getMemberHours(normalizedEntries, member.id) > max;
  });

  if (coverageIssues.length || restConflicts.length || overLimit.length) {
    return NextResponse.json(
      {
        error: "Grafik wymaga poprawy przed publikacją",
        coverageIssues,
        restConflicts,
        overLimit: overLimit.map((member) => member.id),
      },
      { status: 400 }
    );
  }

  // Delete existing entries for this month
  await db
    .delete(scheduleEntries)
    .where(
      and(eq(scheduleEntries.year, year), eq(scheduleEntries.month, month))
    );

  // Insert new entries
  if (normalizedEntries.length > 0) {
    await db.insert(scheduleEntries).values(
      normalizedEntries.map((e) => ({
        userId: e.userId,
        date: e.date,
        shiftType: e.shiftType,
        shiftFunction: e.shiftFunction,
        month,
        year,
      }))
    );
  }

  return NextResponse.json({ success: true });
}
