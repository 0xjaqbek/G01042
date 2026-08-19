import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ZuzycieClient } from "./zuzycie-client";

export default async function ZuzyciePage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <ZuzycieClient
      userId={session.user.id}
      isLeader={session.user.isLeader}
    />
  );
}
