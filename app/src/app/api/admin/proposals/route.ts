import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { proposalEntries, shiftProposals, users } from "@/db/schema";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.isLeader) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));

  if (!year || month < 1 || month > 12) {
    return NextResponse.json({ error: "Invalid month" }, { status: 400 });
  }

  const proposals = await db
    .select({
      id: shiftProposals.id,
      userId: shiftProposals.userId,
      userName: users.name,
      userRole: users.role,
      status: shiftProposals.status,
      submittedAt: shiftProposals.submittedAt,
    })
    .from(shiftProposals)
    .innerJoin(users, eq(shiftProposals.userId, users.id))
    .where(and(eq(shiftProposals.year, year), eq(shiftProposals.month, month)));

  const entries = proposals.length
    ? await db
        .select({
          proposalId: proposalEntries.proposalId,
          date: proposalEntries.date,
          shiftType: proposalEntries.shiftType,
          shiftFunction: proposalEntries.shiftFunction,
        })
        .from(proposalEntries)
        .where(inArray(proposalEntries.proposalId, proposals.map((proposal) => proposal.id)))
    : [];

  return NextResponse.json({
    proposals: proposals.map((proposal) => {
      const proposalDays = entries
        .filter((entry) => entry.proposalId === proposal.id)
        .map((entry) => ({
          day: Number(entry.date.slice(8, 10)),
          shift: `${entry.shiftType}-${entry.shiftFunction}`,
        }));

      return {
        ...proposal,
        entries: proposalDays,
        hours: proposalDays.reduce(
          (total, entry) => total + (entry.shift.startsWith("DN") ? 24 : 12),
          0
        ),
      };
    }),
  });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.isLeader) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { proposalId, status } = await request.json();
  if (!proposalId || !["approved", "rejected", "submitted"].includes(status)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const [proposal] = await db
    .update(shiftProposals)
    .set({ status })
    .where(eq(shiftProposals.id, Number(proposalId)))
    .returning({ id: shiftProposals.id, status: shiftProposals.status });

  if (!proposal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ proposal });
}
