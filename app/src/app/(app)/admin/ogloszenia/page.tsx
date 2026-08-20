import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OgloszeniaAdminClient } from "./ogloszenia-admin-client";

export default async function OgloszeniaAdminPage() {
  const session = await auth();
  if (!session?.user?.isLeader) redirect("/");
  return <OgloszeniaAdminClient />;
}
