import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MeldunekClient } from "./meldunek-client";

export default async function MeldunekPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return <MeldunekClient userId={session.user.id} userName={session.user.name} />;
}
