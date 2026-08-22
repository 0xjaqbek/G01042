import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shiftProposals, proposalEntries } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
  const userId = parseInt(searchParams.get("userId") || session.user.id);
  const year = parseInt(searchParams.get("year") || String(nextMonth.getFullYear()));
  const month = parseInt(searchParams.get("month") || String(nextMonth.getMonth() + 1));

  if (!isFutureMonth(year, month)) {
    return NextResponse.json({ error: "Propozycje są dostępne od następnego miesiąca" }, { status: 400 });
  }
  if (String(userId) !== session.user.id && !session.user.isLeader) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [proposal] = await db
    .select()
    .from(shiftProposals)
    .where(
      and(
        eq(shiftProposals.userId, userId),
        eq(shiftProposals.year, year),
        eq(shiftProposals.month, month)
      )
    )
    .limit(1);

  if (!proposal) {
    return NextResponse.json({ entries: [], status: "draft" });
  }

  const entries = await db
    .select()
    .from(proposalEntries)
    .where(eq(proposalEntries.proposalId, proposal.id));

  const mappedEntries = entries.map((e) => ({
    day: new Date(e.date).getDate(),
    shift: e.shiftType,
  }));

  return NextResponse.json({ entries: mappedEntries, status: proposal.status });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { userId, year, month, entries, status } = body;

  if (!isFutureMonth(Number(year), Number(month))) {
    return NextResponse.json({ error: "Propozycje są dostępne od następnego miesiąca" }, { status: 400 });
  }

  // Verify user can only submit for themselves (unless leader)
  if (String(userId) !== session.user.id && !session.user.isLeader) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete existing proposal for this user/month
  const existing = await db
    .select()
    .from(shiftProposals)
    .where(
      and(
        eq(shiftProposals.userId, parseInt(userId)),
        eq(shiftProposals.year, year),
        eq(shiftProposals.month, month)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Block editing approved or rejected proposals
    if (existing[0].status === "approved" || existing[0].status === "rejected") {
      return NextResponse.json(
        { error: "Propozycja została już rozpatrzona i nie można jej edytować" },
        { status: 400 }
      );
    }

    await db
      .delete(proposalEntries)
      .where(eq(proposalEntries.proposalId, existing[0].id));
    await db
      .delete(shiftProposals)
      .where(eq(shiftProposals.id, existing[0].id));
  }

  // Create new proposal
  const [proposal] = await db
    .insert(shiftProposals)
    .values({
      userId: parseInt(userId),
      month,
      year,
      status: status || "draft",
      submittedAt: status === "submitted" ? new Date() : null,
    })
    .returning();

  // Insert entries — users only pick shift type (D/N/DN), function derived from role
  const defaultFunction = session.user.role === "ratownik" ? "R" : "K";
  if (entries && entries.length > 0) {
    await db.insert(proposalEntries).values(
      entries.map((e: { day: number; shift: string }) => {
        const date = new Date(year, month - 1, e.day);
        return {
          proposalId: proposal.id,
          date: date.toISOString().split("T")[0],
          shiftType: e.shift as "D" | "N" | "DN",
          shiftFunction: defaultFunction as "K" | "R",
        };
      })
    );
  }

  return NextResponse.json({ success: true, proposalId: proposal.id });
}

function isFutureMonth(year: number, month: number) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return false;
  const now = new Date();
  return year * 12 + month > now.getFullYear() * 12 + now.getMonth() + 1;
}
