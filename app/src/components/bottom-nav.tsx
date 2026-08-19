"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  Package,
  AlertTriangle,
  Send,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  showFor?: "all" | "leader";
}

const navItems: NavItem[] = [
  { href: "/", label: "Start", icon: Home },
  { href: "/grafik", label: "Grafik", icon: CalendarDays },
  { href: "/propozycje", label: "Dyżury", icon: Send },
  { href: "/checklista", label: "Checklist", icon: ClipboardList },
  { href: "/zuzycie", label: "Materiały", icon: Package },
  { href: "/meldunek", label: "Meldunek", icon: AlertTriangle },
];

export function BottomNav({
  role,
  isLeader,
}: {
  role: string;
  isLeader: boolean;
}) {
  const pathname = usePathname();

  const visibleItems = navItems.filter(
    (item) => !item.showFor || item.showFor === "all" || isLeader
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-2 text-xs transition-colors",
                isActive
                  ? "text-red-500"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
