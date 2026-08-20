import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Providers } from "@/components/providers";
import { BottomNav } from "@/components/bottom-nav";
import { AnnouncementBanner } from "@/components/announcement-banner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <Providers>
      <div className="flex min-h-screen flex-col pb-16">
        <AnnouncementBanner />
        <main className="flex-1">{children}</main>
        <BottomNav isLeader={session.user.isLeader} />
      </div>
    </Providers>
  );
}
