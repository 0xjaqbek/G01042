import { NextRequest, NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  checklistCompletions,
  checklistItems,
  dailyChecklists,
  users,
} from "@/db/schema";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.isLeader) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const date = new URL(request.url).searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "Date is required" }, { status: 400 });
  }

  const [team, activeItems, checklists] = await Promise.all([
    db
      .select({ id: users.id, name: users.name, role: users.role })
      .from(users)
      .where(eq(users.isActive, true)),
    db
      .select({ id: checklistItems.id })
      .from(checklistItems)
      .where(eq(checklistItems.isActive, true)),
    db
      .select({
        id: dailyChecklists.id,
        userId: dailyChecklists.userId,
        completedAt: dailyChecklists.completedAt,
      })
      .from(dailyChecklists)
      .where(eq(dailyChecklists.date, date)),
  ]);

  const checklistIds = checklists.map((item) => item.id);
  const completions = checklistIds.length
    ? await db
        .select()
        .from(checklistCompletions)
        .where(inArray(checklistCompletions.dailyChecklistId, checklistIds))
    : [];

  return NextResponse.json({
    totalItems: activeItems.length,
    users: team.map((user) => {
      const checklist = checklists.find((item) => item.userId === user.id);
      const completedItems = checklist
        ? completions.filter(
            (item) =>
              item.dailyChecklistId === checklist.id && item.checked === true
          ).length
        : 0;

      return {
        ...user,
        checklistId: checklist?.id ?? null,
        completedAt: checklist?.completedAt ?? null,
        completedItems,
      };
    }),
  });
}
