import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChecklistaClient } from "./checklista-client";

export default async function ChecklistaPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return <ChecklistaClient userId={session.user.id} />;
}
