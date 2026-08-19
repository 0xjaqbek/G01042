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
  isLeader,
}: {
  isLeader: boolean;
}) {
  const pathname = usePathname();

  const visibleItems = navItems.filter(
    (item) => !item.showFor || item.showFor === "all" || isLeader
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto grid w-full max-w-lg grid-cols-6 items-stretch">
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
                "flex min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 py-1.5 text-[10px] leading-none transition-colors min-[390px]:py-2 min-[390px]:text-xs",
                isActive
                  ? "text-red-500"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 min-[390px]:h-5 min-[390px]:w-5" />
              <span className="block w-full overflow-hidden text-ellipsis whitespace-nowrap text-center">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
