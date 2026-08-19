import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { GrafikAdminClient } from "./grafik-admin-client";

export default async function GrafikAdminPage() {
  const session = await auth();
  if (!session?.user?.isLeader) redirect("/");
  return <GrafikAdminClient />;
}
