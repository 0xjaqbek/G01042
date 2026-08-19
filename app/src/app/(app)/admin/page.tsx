import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminClient } from "./admin-client";

export default async function AdminPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!session.user.isLeader) redirect("/");

  return <AdminClient />;
}
