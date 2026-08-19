import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, lte } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { externalShiftEntries } from "@/db/schema";

const SHIFT_TYPES = ["D", "N", "DN"] as const;
type ShiftType = (typeof SHIFT_TYPES)[number];

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Nieprawidłowy miesiąc" }, { status: 400 });
  }

  const firstDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const lastDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;
  const entries = await db
    .select()
    .from(externalShiftEntries)
    .where(and(
      eq(externalShiftEntries.userId, Number(session.user.id)),
      gte(externalShiftEntries.date, firstDate),
      lte(externalShiftEntries.date, lastDate)
    ));

  return NextResponse.json({ entries });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const date = String(body.date ?? "");
  const shiftType = body.shiftType as ShiftType;
  const workplace = String(body.workplace ?? "").trim();
  const notes = String(body.notes ?? "").trim();

  if (!isValidDate(date) || !SHIFT_TYPES.includes(shiftType) || workplace.length < 2 || workplace.length > 100 || notes.length > 500) {
    return NextResponse.json({ error: "Nieprawidłowe dane dyżuru" }, { status: 400 });
  }

  const [entry] = await db
    .insert(externalShiftEntries)
    .values({
      userId: Number(session.user.id),
      date,
      shiftType,
      workplace,
      notes: notes || null,
    })
    .returning();

  return NextResponse.json({ entry }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Nieprawidłowy dyżur" }, { status: 400 });

  const [deleted] = await db
    .delete(externalShiftEntries)
    .where(and(eq(externalShiftEntries.id, id), eq(externalShiftEntries.userId, Number(session.user.id))))
    .returning({ id: externalShiftEntries.id });

  if (!deleted) return NextResponse.json({ error: "Nie znaleziono dyżuru" }, { status: 404 });
  return NextResponse.json({ success: true });
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
