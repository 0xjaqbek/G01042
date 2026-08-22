import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { dailyChecklists, scheduleEntries } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { DashboardClient } from "./dashboard-client";

export default async function HomePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const today = new Date().toISOString().split("T")[0];

  // Check if user has a shift today
  const [todayShift] = await db
    .select({ shiftFunction: scheduleEntries.shiftFunction })
    .from(scheduleEntries)
    .where(
      and(
        eq(scheduleEntries.userId, Number(session.user.id)),
        eq(scheduleEntries.date, today)
      )
    )
    .limit(1);

  // Check if checklist is done for today
  let checklistDone = false;
  if (todayShift) {
    const [checklist] = await db
      .select({ completedAt: dailyChecklists.completedAt })
      .from(dailyChecklists)
      .where(
        and(
          eq(dailyChecklists.userId, Number(session.user.id)),
          eq(dailyChecklists.date, today)
        )
      )
      .limit(1);
    checklistDone = !!checklist?.completedAt;
  }

  return (
    <DashboardClient
      user={session.user}
      hasShiftToday={!!todayShift}
      checklistDone={checklistDone}
    />
  );
}
