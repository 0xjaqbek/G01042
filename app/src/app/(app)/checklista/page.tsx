import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { scheduleEntries } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ChecklistaClient } from "./checklista-client";

export default async function ChecklistaPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const today = new Date().toISOString().split("T")[0];
  const [entry] = await db
    .select({ shiftFunction: scheduleEntries.shiftFunction })
    .from(scheduleEntries)
    .where(
      and(
        eq(scheduleEntries.userId, Number(session.user.id)),
        eq(scheduleEntries.date, today)
      )
    )
    .limit(1);

  return (
    <ChecklistaClient
      userId={session.user.id}
      shiftFunction={entry?.shiftFunction ?? null}
    />
  );
}
