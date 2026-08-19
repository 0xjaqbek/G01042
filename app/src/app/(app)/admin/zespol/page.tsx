import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ZespolClient } from "./zespol-client";

export default async function ZespolPage() {
  const session = await auth();
  if (!session?.user?.isLeader) redirect("/");

  return <ZespolClient />;
}
