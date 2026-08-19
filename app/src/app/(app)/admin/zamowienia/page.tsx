import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ZamowieniaAdminClient } from "./zamowienia-admin-client";

export default async function ZamowieniaAdminPage() {
  const session = await auth();
  if (!session?.user?.isLeader) redirect("/");
  return <ZamowieniaAdminClient />;
}
