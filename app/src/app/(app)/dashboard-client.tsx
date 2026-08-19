"use client";

import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
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
  Settings,
} from "lucide-react";

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
    color: "text-blue-400",
  },
  {
    href: "/propozycje",
    title: "Propozycje dyżurów",
    description: "Zgłoś propozycje na następny miesiąc",
    icon: Send,
    color: "text-green-400",
  },
  {
    href: "/checklista",
    title: "Checklista dzienna",
    description: "Sprzęt, leki, czynności do sprawdzenia",
    icon: ClipboardList,
    color: "text-yellow-400",
  },
  {
    href: "/zuzycie",
    title: "Zużycie materiałów",
    description: "Rejestruj zużycie i generuj zamówienia",
    icon: Package,
    color: "text-purple-400",
  },
  {
    href: "/meldunek",
    title: "Meldunek kierowcy",
    description: "Zgłoś uszkodzenie, awarię lub zdarzenie",
    icon: AlertTriangle,
    color: "text-red-400",
  },
];

export function DashboardClient({ user }: DashboardProps) {
  return (
    <>
      <PageHeader
        title={`Cześć, ${user.name.split(" ").pop()}`}
        description="Panel główny G01042 Przywidz"
      />
      <div className="p-4 space-y-4">
        <div className="grid gap-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Card className="transition-colors hover:bg-accent/50 active:bg-accent">
                  <CardHeader className="flex flex-row items-center gap-4 p-4">
                    <div className={`${item.color}`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">
                        {item.title}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {item.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>

        {user.isLeader && (
          <Link href="/admin">
            <Card className="border-red-900/50 transition-colors hover:bg-accent/50">
              <CardHeader className="flex flex-row items-center gap-4 p-4">
                <Settings className="h-8 w-8 text-red-400" />
                <div>
                  <CardTitle className="text-base">
                    Panel lidera
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Zarządzaj zespołem, zatwierdzaj grafik
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        )}
      </div>
    </>
  );
}
