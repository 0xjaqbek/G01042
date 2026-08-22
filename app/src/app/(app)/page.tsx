import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { dailyChecklists, scheduleEntries, shiftProposals } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
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

  // Check if proposal reminder should show (5th-12th of month, no submitted proposal for next month)
  const now = new Date();
  const dayOfMonth = now.getDate();
  let showProposalReminder = false;
  if (dayOfMonth >= 5 && dayOfMonth <= 12) {
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const [existing] = await db
      .select({ id: shiftProposals.id })
      .from(shiftProposals)
      .where(
        and(
          eq(shiftProposals.userId, Number(session.user.id)),
          eq(shiftProposals.year, nextMonth.getFullYear()),
          eq(shiftProposals.month, nextMonth.getMonth() + 1),
          ne(shiftProposals.status, "draft")
        )
      )
      .limit(1);
    showProposalReminder = !existing;
  }

  return (
    <DashboardClient
      user={session.user}
      hasShiftToday={!!todayShift}
      checklistDone={checklistDone}
      showProposalReminder={showProposalReminder}
    />
  );
}
