"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  Package,
  AlertTriangle,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { href: "/", label: "Start", icon: LayoutDashboard },
  { href: "/grafik", label: "Grafik", icon: CalendarDays },
  { href: "/checklista", label: "Kontrola", icon: ClipboardList },
  { href: "/zuzycie", label: "Materiały", icon: Package },
  { href: "/zgloszenia", label: "Zgłoszenia", icon: AlertTriangle },
];

export function BottomNav({ isLeader }: { isLeader: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto grid w-full max-w-lg grid-cols-5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors",
                "min-h-[52px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-b-full bg-primary" />
              )}
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform",
                  isActive && "scale-110"
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
