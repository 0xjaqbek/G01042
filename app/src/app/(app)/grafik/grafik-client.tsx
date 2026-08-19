"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScheduleEntry {
  id: number;
  userId: number;
  userName: string;
  date: string;
  shiftType: "D" | "N" | "DN";
  shiftFunction: "K" | "R";
}

const SHIFT_COLORS: Record<string, string> = {
  "D-K": "bg-blue-600/80 text-white",
  "D-R": "bg-blue-400/80 text-white",
  "N-K": "bg-indigo-700/80 text-white",
  "N-R": "bg-indigo-500/80 text-white",
  "DN-K": "bg-red-600/80 text-white",
  "DN-R": "bg-red-400/80 text-white",
};

const DAY_NAMES_SHORT = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "Sb"];
const MONTH_NAMES = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export function GrafikClient({
  userId,
  isLeader,
}: {
  userId: string;
  isLeader: boolean;
}) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/schedule?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.entries || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [year, month]);

  const daysInMonth = getDaysInMonth(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Group entries by user
  const userMap = new Map<number, { name: string; shifts: Map<number, ScheduleEntry> }>();
  for (const e of entries) {
    if (!userMap.has(e.userId)) {
      userMap.set(e.userId, { name: e.userName, shifts: new Map() });
    }
    const day = new Date(e.date).getDate();
    userMap.get(e.userId)!.shifts.set(day, e);
  }

  function prevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  return (
    <>
      <PageHeader title="Grafik dyżurów" />
      <div className="p-4 space-y-4">
        {/* Month selector */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold">
            {MONTH_NAMES[month - 1]} {year}
          </h2>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(SHIFT_COLORS).map(([key, color]) => (
            <Badge key={key} className={cn(color, "text-xs")}>
              {key}
            </Badge>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
          </div>
        ) : entries.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            Brak grafiku na {MONTH_NAMES[month - 1]} {year}
          </Card>
        ) : (
          <ScrollArea className="w-full">
            <div className="min-w-[600px]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="sticky left-0 bg-background px-2 py-1 text-left font-medium min-w-[120px]">
                      Pracownik
                    </th>
                    {days.map((day) => {
                      const date = new Date(year, month - 1, day);
                      const dayName = DAY_NAMES_SHORT[date.getDay()];
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                      return (
                        <th
                          key={day}
                          className={cn(
                            "px-1 py-1 text-center min-w-[36px]",
                            isWeekend && "text-red-400"
                          )}
                        >
                          <div>{day}</div>
                          <div className="text-[10px] font-normal text-muted-foreground">
                            {dayName}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {Array.from(userMap.entries()).map(([uid, data]) => (
                    <tr key={uid} className="border-b border-border/50">
                      <td className="sticky left-0 bg-background px-2 py-1 font-medium">
                        {data.name}
                      </td>
                      {days.map((day) => {
                        const shift = data.shifts.get(day);
                        if (!shift) return <td key={day} className="px-1 py-1" />;
                        const label = `${shift.shiftType}-${shift.shiftFunction}`;
                        const color = SHIFT_COLORS[label] || "bg-gray-600";
                        return (
                          <td key={day} className="px-0.5 py-1">
                            <div
                              className={cn(
                                "rounded px-1 py-0.5 text-center text-[10px] font-medium",
                                color
                              )}
                            >
                              {label}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        )}

        {/* Coverage summary */}
        {entries.length > 0 && (
          <Card className="p-3">
            <h3 className="text-sm font-medium mb-2">Obsada</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Dzień: </span>
                <span className="font-medium">
                  {days.map((day) => {
                    const count = entries.filter(
                      (e) =>
                        new Date(e.date).getDate() === day &&
                        (e.shiftType === "D" || e.shiftType === "DN")
                    ).length;
                    return count;
                  }).join(", ")}
                </span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
