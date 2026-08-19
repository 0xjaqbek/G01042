import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { scheduleEntries, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

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
  const { entries: newEntries, year, month } = body;

  // Delete existing entries for this month
  await db
    .delete(scheduleEntries)
    .where(
      and(eq(scheduleEntries.year, year), eq(scheduleEntries.month, month))
    );

  // Insert new entries
  if (newEntries && newEntries.length > 0) {
    await db.insert(scheduleEntries).values(
      newEntries.map((e: any) => ({
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
