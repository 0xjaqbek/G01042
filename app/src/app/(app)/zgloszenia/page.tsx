import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ZgloszeniaClient } from "./zgloszenia-client";

export default async function ZgloszeniaPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return <ZgloszeniaClient userId={session.user.id} userName={session.user.name} />;
}
