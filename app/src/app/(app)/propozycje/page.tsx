import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getHoursLimit } from "@/lib/schedule-rules";
import { PropozycjeClient } from "./propozycje-client";

export default async function PropozycjePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const limits = getHoursLimit(session.user.name);

  return (
    <PropozycjeClient
      userId={session.user.id}
      userName={session.user.name}
      userRole={session.user.role}
      hoursMin={limits.min}
      hoursMax={limits.max}
    />
  );
}
