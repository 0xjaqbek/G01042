"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Announcement {
  id: number;
  title: string;
  body: string | null;
  priority: "normal" | "urgent";
  acked: boolean;
  authorName: string;
  createdAt: string;
}

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const fetchAnnouncements = useCallback(() => {
    fetch("/api/announcements")
      .then((r) => r.json())
      .then((data) => setAnnouncements(data.announcements ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchAnnouncements();
    // Poll every 60s for new announcements
    const interval = setInterval(fetchAnnouncements, 60_000);
    return () => clearInterval(interval);
  }, [fetchAnnouncements]);

  async function acknowledge(id: number) {
    await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ announcementId: id }),
    });
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acked: true } : a))
    );
    setDismissed((prev) => new Set(prev).add(id));
  }

  // Only show urgent, unacked, not dismissed
  const urgent = announcements.filter(
    (a) => a.priority === "urgent" && !a.acked && !dismissed.has(a.id)
  );

  if (urgent.length === 0) return null;

  return (
    <div className="space-y-0">
      {urgent.map((a) => (
        <div
          key={a.id}
          className="flex items-center gap-3 border-b border-red-800/40 bg-red-950/40 px-4 py-2.5"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-red-200">{a.title}</p>
            {a.body && (
              <p className="text-xs text-red-300/70 line-clamp-1">{a.body}</p>
            )}
          </div>
          <Button
            size="sm"
            className="h-8 shrink-0 bg-red-600 text-xs font-semibold hover:bg-red-700"
            onClick={() => acknowledge(a.id)}
          >
            <Check className="mr-1 h-3 w-3" />
            OK
          </Button>
        </div>
      ))}
    </div>
  );
}
