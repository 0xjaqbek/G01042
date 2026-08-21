"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CalendarDays,
  Check,
  ClipboardList,
  Package,
  AlertTriangle,
  Megaphone,
  Send,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardProps {
  user: {
    id: string;
    name: string;
    role: string;
    isLeader: boolean;
  };
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
    iconBg: "bg-blue-500/15",
    iconColor: "text-blue-400",
  },
  {
    href: "/propozycje",
    title: "Propozycje dyżurów",
    description: "Zgłoś propozycje na następny miesiąc",
    icon: Send,
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-400",
  },
  {
    href: "/checklista",
    title: "Checklista dzienna",
    description: "Sprzęt, leki, czynności do sprawdzenia",
    icon: ClipboardList,
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-400",
  },
  {
    href: "/zuzycie",
    title: "Zużycie materiałów",
    description: "Rejestruj zużycie i generuj zamówienia",
    icon: Package,
    iconBg: "bg-violet-500/15",
    iconColor: "text-violet-400",
  },
  {
    href: "/zgloszenia",
    title: "Zgłoszenia",
    description: "Zdarzenia, incydenty i wiadomości do lidera",
    icon: AlertTriangle,
    iconBg: "bg-red-500/15",
    iconColor: "text-red-400",
  },
];

export function DashboardClient({ user }: DashboardProps) {
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

  // Normal announcements not yet acked
  const normalUnacked = announcements.filter(
    (a) => a.priority === "normal" && !a.acked
  );

  return (
    <>
      <PageHeader
        title={`Cześć, ${firstName}`}
        description="Panel główny G01042 Przywidz"
      />
      <div className="p-4 space-y-3">
        {/* Announcements card — only when there are normal announcements */}
        {normalUnacked.length > 0 && (
          <Card className="border-sky-800/30 bg-sky-950/15">
            <CardHeader className="flex-row items-center gap-3 px-4 pb-2 pt-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/15">
                <Megaphone className="h-4 w-4 text-sky-400" />
              </div>
              <CardTitle className="text-sm">
                Ogłoszenia
                {normalUnacked.length > 0 && (
                  <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white">
                    {normalUnacked.length}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0 space-y-2">
              {normalUnacked.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-lg border border-sky-700/40 bg-sky-950/20 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {a.title}
                    </p>
                    {a.body && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {a.body}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {a.authorName} · {new Date(a.createdAt).toLocaleDateString("pl")}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="h-8 shrink-0 text-xs"
                    onClick={() => acknowledge(a.id)}
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Przyjmuję
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="press-scale cursor-pointer border-transparent bg-card hover:bg-accent/60">
                <CardHeader className="flex flex-row items-center gap-4 p-4">
                  <div
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                      item.iconBg
                    )}
                  >
                    <Icon className={cn("h-5 w-5", item.iconColor)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-[15px] font-semibold">
                      {item.title}
                    </CardTitle>
                    <CardDescription className="text-xs leading-snug">
                      {item.description}
                    </CardDescription>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </CardHeader>
              </Card>
            </Link>
          );
        })}

        {user.isLeader && (
          <Link href="/admin">
            <Card className="press-scale cursor-pointer border-primary/20 bg-primary/5 hover:bg-primary/10">
              <CardHeader className="flex flex-row items-center gap-4 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-[15px] font-semibold">
                    Panel lidera
                  </CardTitle>
                  <CardDescription className="text-xs leading-snug">
                    Zarządzaj zespołem, zatwierdzaj grafik
                  </CardDescription>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </CardHeader>
            </Card>
          </Link>
        )}
      </div>
    </>
  );
}
