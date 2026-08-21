import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { scheduleChangelogs, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.isLeader) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));

  const entries = await db
    .select({
      id: scheduleChangelogs.id,
      publishedByName: users.name,
      changes: scheduleChangelogs.changes,
      publishedAt: scheduleChangelogs.publishedAt,
    })
    .from(scheduleChangelogs)
    .innerJoin(users, eq(scheduleChangelogs.publishedBy, users.id))
    .where(
      and(
        eq(scheduleChangelogs.year, year),
        eq(scheduleChangelogs.month, month)
      )
    )
    .orderBy(desc(scheduleChangelogs.publishedAt));

  return NextResponse.json({ entries });
}
