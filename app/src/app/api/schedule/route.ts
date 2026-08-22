import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { scheduleChangelogs, scheduleEntries, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import {
  getCoverageIssueDates,
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
    .select({ id: users.id, name: users.name, minHours: users.minHours, maxHours: users.maxHours })
    .from(users)
    .where(eq(users.isActive, true));
  const teamIds = new Set(team.map((member) => member.id));

  if (normalizedEntries.some((entry) => !teamIds.has(entry.userId))) {
    return NextResponse.json({ error: "Grafik zawiera nieaktywnego pracownika" }, { status: 400 });
  }

  const coverageIssues = getCoverageIssueDates(normalizedEntries, year, month);
  const restConflicts = getRestConflicts(normalizedEntries);
  const overLimit = team.filter((member) => {
    return getMemberHours(normalizedEntries, member.id) > member.maxHours;
  });
  const underLimit = team.filter((member) => {
    return getMemberHours(normalizedEntries, member.id) < member.minHours;
  });

  if (coverageIssues.length || restConflicts.length || overLimit.length || underLimit.length) {
    return NextResponse.json(
      {
        error: "Grafik wymaga poprawy przed publikacją",
        coverageIssues,
        restConflicts,
        overLimit: overLimit.map((member) => member.id),
        underLimit: underLimit.map((member) => member.id),
      },
      { status: 400 }
    );
  }

  // Fetch old entries for changelog diff
  const oldEntries = await db
    .select({
      userId: scheduleEntries.userId,
      userName: users.name,
      date: scheduleEntries.date,
      shiftType: scheduleEntries.shiftType,
      shiftFunction: scheduleEntries.shiftFunction,
    })
    .from(scheduleEntries)
    .innerJoin(users, eq(scheduleEntries.userId, users.id))
    .where(and(eq(scheduleEntries.year, year), eq(scheduleEntries.month, month)));

  // Build lookup maps for diff
  const oldMap = new Map(oldEntries.map((e) => [`${e.userId}:${e.date}`, e]));
  const newMap = new Map(normalizedEntries.map((e) => [`${e.userId}:${e.date}`, e]));
  const nameMap = new Map(team.map((m) => [m.id, m.name]));

  const added: { userId: number; userName: string; date: string; shift: string }[] = [];
  const removed: { userId: number; userName: string; date: string; shift: string }[] = [];
  const modified: { userId: number; userName: string; date: string; from: string; to: string }[] = [];

  for (const [key, entry] of newMap) {
    const old = oldMap.get(key);
    const shift = `${entry.shiftType}-${entry.shiftFunction}`;
    if (!old) {
      added.push({ userId: entry.userId, userName: nameMap.get(entry.userId) ?? "?", date: entry.date, shift });
    } else {
      const oldShift = `${old.shiftType}-${old.shiftFunction}`;
      if (oldShift !== shift) {
        modified.push({ userId: entry.userId, userName: nameMap.get(entry.userId) ?? "?", date: entry.date, from: oldShift, to: shift });
      }
    }
  }
  for (const [key, entry] of oldMap) {
    if (!newMap.has(key)) {
      removed.push({ userId: entry.userId, userName: entry.userName, date: entry.date, shift: `${entry.shiftType}-${entry.shiftFunction}` });
    }
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

  // Save changelog entry
  if (added.length > 0 || removed.length > 0 || modified.length > 0 || oldEntries.length === 0) {
    await db.insert(scheduleChangelogs).values({
      publishedBy: Number(session.user.id),
      month,
      year,
      changes: JSON.stringify({
        added,
        removed,
        modified,
        isFirst: oldEntries.length === 0,
        totalEntries: normalizedEntries.length,
      }),
    });
  }

  return NextResponse.json({ success: true });
}
