import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { GrafikClient } from "./grafik-client";
import { db } from "@/db";
import { scheduleEntries } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

async function getInitialScheduleMonth() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [currentSchedule] = await db
    .select({
      year: scheduleEntries.year,
      month: scheduleEntries.month,
    })
    .from(scheduleEntries)
    .where(
      and(
        eq(scheduleEntries.year, currentYear),
        eq(scheduleEntries.month, currentMonth)
      )
    )
    .limit(1);

  if (currentSchedule) {
    return { year: currentYear, month: currentMonth };
  }

  const [latestSchedule] = await db
    .select({
      year: scheduleEntries.year,
      month: scheduleEntries.month,
    })
    .from(scheduleEntries)
    .orderBy(desc(scheduleEntries.year), desc(scheduleEntries.month))
    .limit(1);

  return latestSchedule ?? { year: currentYear, month: currentMonth };
}

export default async function GrafikPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const params = await searchParams;
  const requestedYear = Number(params.year);
  const requestedMonth = Number(params.month);
  const initialScheduleMonth =
    requestedYear > 2000 && requestedMonth >= 1 && requestedMonth <= 12
      ? { year: requestedYear, month: requestedMonth }
      : await getInitialScheduleMonth();

  return (
    <GrafikClient
      userId={session.user.id}
      initialYear={initialScheduleMonth.year}
      initialMonth={initialScheduleMonth.month}
    />
  );
}
