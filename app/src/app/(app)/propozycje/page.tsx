import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PropozycjeClient } from "./propozycje-client";

export default async function PropozycjePage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <PropozycjeClient
      userId={session.user.id}
      userName={session.user.name}
      userRole={session.user.role}
    />
  );
}
