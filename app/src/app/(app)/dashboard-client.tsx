"use client";

import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CalendarDays,
  ClipboardList,
  Package,
  AlertTriangle,
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
    href: "/meldunek",
    title: "Meldunek kierowcy",
    description: "Zgłoś uszkodzenie, awarię lub zdarzenie",
    icon: AlertTriangle,
    iconBg: "bg-red-500/15",
    iconColor: "text-red-400",
  },
];

export function DashboardClient({ user }: DashboardProps) {
  const firstName = user.name.split(" ").pop();

  return (
    <>
      <PageHeader
        title={`Cześć, ${firstName}`}
        description="Panel główny G01042 Przywidz"
      />
      <div className="p-4 space-y-3">
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
