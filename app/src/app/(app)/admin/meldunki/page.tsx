import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MeldunkiAdminClient } from "./meldunki-admin-client";

export default async function MeldunkiAdminPage() {
  const session = await auth();
  if (!session?.user?.isLeader) redirect("/");
  return <MeldunkiAdminClient />;
}
