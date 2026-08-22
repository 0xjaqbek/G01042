import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PropozycjeClient } from "./propozycje-client";

export default async function PropozycjePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [user] = await db
    .select({ minHours: users.minHours, maxHours: users.maxHours })
    .from(users)
    .where(eq(users.id, Number(session.user.id)))
    .limit(1);

  return (
    <PropozycjeClient
      userId={session.user.id}
      userName={session.user.name}
      hoursMin={user?.minHours ?? 120}
      hoursMax={user?.maxHours ?? 240}
    />
  );
}
