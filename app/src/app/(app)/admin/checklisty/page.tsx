import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChecklistyAdminClient } from "./checklisty-admin-client";

export default async function ChecklistyAdminPage() {
  const session = await auth();
  if (!session?.user?.isLeader) redirect("/");
  return <ChecklistyAdminClient />;
}
