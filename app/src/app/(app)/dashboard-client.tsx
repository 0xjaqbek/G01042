"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardList,
  Package,
  AlertTriangle,
  Megaphone,
  Send,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

interface DashboardProps {
  user: {
    id: string;
    name: string;
    role: string;
    isLeader: boolean;
  };
  hasShiftToday: boolean;
  checklistDone: boolean;
}

interface Announcement {
  id: number;
  title: string;
  body: string | null;
  priority: "normal" | "urgent";
  acked: boolean;
  authorName: string;
  createdAt: string;
}

const menuItems = [
  {
    href: "/grafik",
    title: "Grafik dyżurów",
    description: "Harmonogram zmian na bieżący miesiąc",
    icon: CalendarDays,
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-500/10 dark:bg-blue-500/15",
  },
  {
    href: "/propozycje",
    title: "Propozycje",
    description: "Zgłoś propozycje na następny miesiąc",
    icon: Send,
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
  },
  {
    href: "/checklista",
    title: "Checklista",
    description: "Sprzęt, leki, czynności do sprawdzenia",
    icon: ClipboardList,
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-500/10 dark:bg-amber-500/15",
  },
  {
    href: "/zuzycie",
    title: "Zużycie",
    description: "Rejestruj zużycie i generuj zamówienia",
    icon: Package,
    color: "text-violet-500 dark:text-violet-400",
    bg: "bg-violet-500/10 dark:bg-violet-500/15",
  },
  {
    href: "/zgloszenia",
    title: "Zgłoszenia",
    description: "Zdarzenia, incydenty i wiadomości do lidera",
    icon: AlertTriangle,
    color: "text-red-500 dark:text-red-400",
    bg: "bg-red-500/10 dark:bg-red-500/15",
  },
];

export function DashboardClient({ user, hasShiftToday, checklistDone }: DashboardProps) {
  const firstName = user.name.split(" ").pop();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    fetch("/api/announcements")
      .then((r) => r.json())
      .then((data) => setAnnouncements(data.announcements ?? []))
      .catch(() => {});
  }, []);

  async function acknowledge(id: number) {
    await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ announcementId: id }),
    });
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acked: true } : a))
    );
  }

  const normalUnacked = announcements.filter(
    (a) => a.priority === "normal" && !a.acked
  );

  const roleLabel = user.isLeader
    ? "Lider"
    : user.role === "kierowca"
      ? "Kierowca"
      : "Ratownik";

  return (
    <div className="flex min-h-[calc(100dvh-52px)] flex-col">
      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground tracking-widest uppercase">
              G01042 Przywidz
            </p>
            <h1 className="text-xl font-bold tracking-tight mt-0.5">
              Cześć, {firstName}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[11px]">
              {roleLabel}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => signOut({ callbackUrl: "/login" })}
              aria-label="Wyloguj"
              title="Wyloguj"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Checklist reminder */}
      {hasShiftToday && !checklistDone && (
        <div className="px-4 pb-2">
          <Link href="/checklista">
            <div className="flex items-center gap-3 rounded-xl border border-amber-600/40 bg-amber-950/20 p-3 cursor-pointer hover:bg-amber-950/30 transition-colors">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
                <ClipboardList className="h-4 w-4 text-amber-500 dark:text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Checklista nieukończona</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Masz dzisiaj dyżur — wypełnij checklistę
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-amber-500/60" />
            </div>
          </Link>
        </div>
      )}

      {/* Announcements */}
      {normalUnacked.length > 0 && (
        <div className="px-4 pb-2 space-y-2">
          {normalUnacked.map((a) => (
            <div
              key={a.id}
              className="flex items-start gap-3 rounded-xl border border-sky-700/40 bg-sky-950/20 p-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 mt-0.5">
                <Megaphone className="h-4 w-4 text-sky-500 dark:text-sky-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{a.title}</p>
                {a.body && (
                  <p className="text-xs text-muted-foreground line-clamp-3 mt-0.5">
                    {a.body}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground mt-1">
                  {a.authorName} · {new Date(a.createdAt).toLocaleDateString("pl")}
                </p>
              </div>
              <Button
                size="sm"
                className="h-8 shrink-0 text-xs mt-0.5"
                onClick={() => acknowledge(a.id)}
              >
                <Check className="mr-1 h-3 w-3" />
                Przyjmuję
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Menu — compact single-column list */}
      <div className="flex-1 px-4 pb-2">
        <div className="flex flex-col gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div className="press-scale flex items-center gap-3.5 px-4 py-3 rounded-xl border border-border/50 bg-card cursor-pointer hover:bg-accent/50 active:bg-accent/80 transition-colors">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      item.bg
                    )}
                  >
                    <Icon className={cn("h-[18px] w-[18px]", item.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold leading-tight">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Leader panel — separate section */}
        {user.isLeader && (
          <Link href="/admin">
            <div className="mt-3 press-scale flex items-center gap-3.5 px-4 py-3 rounded-xl border border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/10 active:bg-primary/15 transition-colors">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/15">
                <ShieldCheck className="h-[18px] w-[18px] text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold leading-tight">
                  Panel lidera
                </p>
                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                  Zarządzaj zespołem, zatwierdzaj grafik
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
