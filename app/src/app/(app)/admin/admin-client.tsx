"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarDays, ClipboardCheck, Package, AlertTriangle, ChevronRight, Megaphone } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const adminItems = [
  {
    href: "/admin/ogloszenia",
    title: "Ogłoszenia",
    description: "Tablica informacyjna, pilne komunikaty",
    icon: Megaphone,
    iconBg: "bg-sky-500/15",
    iconColor: "text-sky-400",
  },
  {
    href: "/admin/zespol",
    title: "Zespół",
    description: "Zarządzaj członkami, resetuj PIN-y",
    icon: Users,
    iconBg: "bg-blue-500/15",
    iconColor: "text-blue-400",
  },
  {
    href: "/admin/grafik",
    title: "Propozycje grafiku",
    description: "Przeglądaj i zatwierdzaj dyspozycyjność",
    icon: CalendarDays,
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-400",
  },
  {
    href: "/admin/checklisty",
    title: "Przegląd checklist",
    description: "Status wypełnienia checklist dziennych",
    icon: ClipboardCheck,
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-400",
  },
  {
    href: "/admin/zamowienia",
    title: "Zamówienia",
    description: "Generuj zamówienia na podstawie zużycia",
    icon: Package,
    iconBg: "bg-violet-500/15",
    iconColor: "text-violet-400",
  },
  {
    href: "/admin/meldunki",
    title: "Meldunki",
    description: "Wszystkie zgłoszenia zdarzeń",
    icon: AlertTriangle,
    iconBg: "bg-red-500/15",
    iconColor: "text-red-400",
  },
];

export function AdminClient() {
  return (
    <>
      <PageHeader title="Panel lidera" description="Zarządzanie zespołem G01042" />
      <div className="p-4 space-y-3">
        {adminItems.map((item) => {
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
      </div>
    </>
  );
}
