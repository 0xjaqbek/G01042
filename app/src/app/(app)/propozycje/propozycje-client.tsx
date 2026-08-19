"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Send, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SHIFT_OPTIONS = ["D-K", "D-R", "N-K", "N-R", "DN-K", "DN-R"] as const;
const SHIFT_COLORS: Record<string, string> = {
  "D-K": "bg-blue-600/80",
  "D-R": "bg-blue-400/80",
  "N-K": "bg-indigo-700/80",
  "N-R": "bg-indigo-500/80",
  "DN-K": "bg-red-600/80",
  "DN-R": "bg-red-400/80",
};

const DAY_NAMES = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "Sb"];
const MONTH_NAMES = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];

interface ProposalDay {
  day: number;
  shift: string; // e.g. "DN-K"
}

export function PropozycjeClient({
  userId,
  userName,
  userRole,
}: {
  userId: string;
  userName: string;
  userRole: string;
}) {
  // Next month by default
  const now = new Date();
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const [year, setYear] = useState(nextMonthDate.getFullYear());
  const [month, setMonth] = useState(nextMonthDate.getMonth() + 1);
  const [selectedDays, setSelectedDays] = useState<ProposalDay[]>([]);
  const [status, setStatus] = useState<string>("draft");
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const daysInMonth = new Date(year, month, 0).getDate();
  const defaultShift = userRole === "kierowca" ? "DN-K" : "DN-R";

  // Load existing proposal
  useEffect(() => {
    fetch(`/api/proposals?userId=${userId}&year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.entries) {
          setSelectedDays(data.entries);
          setStatus(data.status || "draft");
        } else {
          setSelectedDays([]);
          setStatus("draft");
        }
      })
      .catch(() => {});
  }, [userId, year, month]);

  function toggleDay(day: number) {
    if (status === "submitted" || status === "approved") return;
    setSelectedDays((prev) => {
      const exists = prev.find((d) => d.day === day);
      if (exists) return prev.filter((d) => d.day !== day);
      return [...prev, { day, shift: defaultShift }];
    });
  }

  function changeShift(day: number, shift: string) {
    setSelectedDays((prev) =>
      prev.map((d) => (d.day === day ? { ...d, shift } : d))
    );
  }

  // Calculate hours
  const totalHours = selectedDays.reduce((sum, d) => {
    if (d.shift.startsWith("DN")) return sum + 24;
    return sum + 12;
  }, 0);

  async function saveDraft() {
    setSaving(true);
    await fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        year,
        month,
        entries: selectedDays,
        status: "draft",
      }),
    });
    setSaving(false);
  }

  async function submitProposal() {
    setSubmitting(true);
    await fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        year,
        month,
        entries: selectedDays,
        status: "submitted",
      }),
    });
    setStatus("submitted");
    setSubmitting(false);
  }

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  }

  return (
    <>
      <PageHeader
        title="Propozycje dyżurów"
        description={`${userName} — ${MONTH_NAMES[month - 1]} ${year}`}
      />
      <div className="p-4 space-y-4">
        {/* Month nav */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h2 className="text-lg font-semibold">
              {MONTH_NAMES[month - 1]} {year}
            </h2>
            <Badge
              variant={
                status === "submitted"
                  ? "default"
                  : status === "approved"
                  ? "default"
                  : "secondary"
              }
              className={cn(
                "text-xs mt-1",
                status === "approved" && "bg-green-600",
                status === "submitted" && "bg-yellow-600"
              )}
            >
              {status === "draft"
                ? "Szkic"
                : status === "submitted"
                ? "Wysłane"
                : status === "approved"
                ? "Zatwierdzone"
                : "Odrzucone"}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {DAY_NAMES.map((d) => (
            <div
              key={d}
              className="text-center text-xs font-medium text-muted-foreground py-1"
            >
              {d}
            </div>
          ))}
          {/* Empty cells for first day offset */}
          {Array.from(
            { length: new Date(year, month - 1, 1).getDay() },
            (_, i) => (
              <div key={`empty-${i}`} />
            )
          )}
          {/* Day cells */}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const selected = selectedDays.find((d) => d.day === day);
            const date = new Date(year, month - 1, day);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

            return (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                disabled={status === "submitted" || status === "approved"}
                className={cn(
                  "relative flex flex-col items-center rounded-lg p-1.5 text-sm transition-colors min-h-[52px]",
                  selected
                    ? SHIFT_COLORS[selected.shift] || "bg-red-600/80"
                    : "bg-card hover:bg-accent",
                  isWeekend && !selected && "text-red-400",
                  (status === "submitted" || status === "approved") &&
                    "opacity-75 cursor-not-allowed"
                )}
              >
                <span className="font-medium">{day}</span>
                {selected && (
                  <span className="text-[10px] font-bold text-white">
                    {selected.shift}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Shift type selector for selected days */}
        {selectedDays.length > 0 && status === "draft" && (
          <Card>
            <CardHeader className="p-3">
              <CardTitle className="text-sm">Wybrane dyżury</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2">
              {selectedDays
                .sort((a, b) => a.day - b.day)
                .map((d) => (
                  <div
                    key={d.day}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-sm font-medium w-8">{d.day}</span>
                    <Select
                      value={d.shift}
                      onValueChange={(v) => changeShift(d.day, v ?? defaultShift)}
                    >
                      <SelectTrigger className="h-8 w-24 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SHIFT_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt} className="text-xs">
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleDay(d.day)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        <Card className="p-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Ilość dyżurów:</span>
            <span className="font-medium">{selectedDays.length}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-muted-foreground">Godziny łącznie:</span>
            <span className="font-bold">{totalHours}h</span>
          </div>
        </Card>

        {/* Actions */}
        {status === "draft" && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={saveDraft}
              disabled={saving}
            >
              {saving ? "Zapisywanie..." : "Zapisz szkic"}
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700"
              onClick={submitProposal}
              disabled={submitting || selectedDays.length === 0}
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? "Wysyłanie..." : "Wyślij"}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
