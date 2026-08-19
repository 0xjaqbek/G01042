import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { GrafikClient } from "./grafik-client";

export default async function GrafikPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return <GrafikClient userId={session.user.id} isLeader={session.user.isLeader} />;
}
