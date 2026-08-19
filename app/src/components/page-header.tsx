"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, LogOut } from "lucide-react";

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const showBackButton = pathname !== "/";

  function goBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(pathname.startsWith("/admin/") ? "/admin" : "/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center gap-2 px-4 py-3">
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={goBack}
            aria-label="Wstecz"
            title="Wstecz"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="truncate text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {session?.user && (
            <>
              <Badge variant="secondary" className="text-[11px]">
                {session.user.isLeader ? "Lider" : session.user.role === "kierowca" ? "Kierowca" : "Ratownik"}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => signOut({ callbackUrl: "/login" })}
                aria-label="Wyloguj"
                title="Wyloguj"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
