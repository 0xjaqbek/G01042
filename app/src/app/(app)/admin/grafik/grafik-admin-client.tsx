"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, Check, ChevronLeft, ChevronRight, Clock, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const MONTHS = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
const STATUS = {
  draft: { label: "Szkic", className: "bg-zinc-600" },
  submitted: { label: "Do decyzji", className: "bg-amber-600" },
  approved: { label: "Zatwierdzone", className: "bg-emerald-600" },
  rejected: { label: "Odrzucone", className: "bg-red-600" },
} as const;

interface Proposal {
  id: number;
  userName: string;
  userRole: string;
  status: keyof typeof STATUS;
  hours: number;
  entries: { day: number; shift: string }[];
}

export function GrafikAdminClient() {
  const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
  const [year, setYear] = useState(nextMonth.getFullYear());
  const [month, setMonth] = useState(nextMonth.getMonth() + 1);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/proposals?year=${year}&month=${month}`)
      .then((response) => response.json())
      .then((data) => { if (active) setProposals(data.proposals ?? []); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [year, month]);

  function changeMonth(delta: number) {
    setLoading(true);
    const date = new Date(year, month - 1 + delta, 1);
    setYear(date.getFullYear());
    setMonth(date.getMonth() + 1);
  }

  async function setStatus(proposalId: number, status: "approved" | "rejected") {
    setUpdatingId(proposalId);
    const response = await fetch("/api/admin/proposals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposalId, status }),
    });
    if (response.ok) {
      setProposals((current) => current.map((proposal) => proposal.id === proposalId ? { ...proposal, status } : proposal));
    }
    setUpdatingId(null);
  }

  const submitted = proposals.filter((proposal) => proposal.status === "submitted").length;

  return (
    <>
      <PageHeader title="Propozycje grafiku" description="Weryfikacja dyspozycyjności zespołu" />
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)} aria-label="Poprzedni miesiąc"><ChevronLeft /></Button>
          <div className="text-center">
            <h2 className="font-semibold">{MONTHS[month - 1]} {year}</h2>
            <p className="text-xs text-muted-foreground">{submitted} oczekuje na decyzję</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => changeMonth(1)} aria-label="Następny miesiąc"><ChevronRight /></Button>
        </div>

        <Link href="/grafik" className={buttonVariants({ variant: "outline", className: "w-full" })}><CalendarCheck className="mr-2 h-4 w-4" />Otwórz opublikowany grafik</Link>

        {loading ? <Loading /> : proposals.length === 0 ? <Empty text="Brak propozycji na wybrany miesiąc" /> : (
          <div className="space-y-3">
            {proposals.map((proposal) => {
              const status = STATUS[proposal.status];
              return (
                <Card key={proposal.id}>
                  <CardContent className="space-y-3 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="text-sm font-medium">{proposal.userName}</p><p className="text-xs text-muted-foreground">{proposal.userRole === "kierowca" ? "Kierowca" : "Ratownik"}</p></div>
                      <Badge className={cn("text-white", status.className)}>{status.label}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground"><span>{proposal.entries.length} zmian</span><span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{proposal.hours} h</span></div>
                    <div className="flex flex-wrap gap-1.5">{proposal.entries.map((entry) => <Badge key={`${entry.day}-${entry.shift}`} variant="secondary">{entry.day}: {entry.shift}</Badge>)}</div>
                    {(proposal.status === "submitted" || proposal.status === "approved" || proposal.status === "rejected") && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800" disabled={updatingId === proposal.id || proposal.status === "approved"} onClick={() => setStatus(proposal.id, "approved")}><Check className="mr-1 h-4 w-4" />Zatwierdź</Button>
                        <Button size="sm" variant="outline" disabled={updatingId === proposal.id || proposal.status === "rejected"} onClick={() => setStatus(proposal.id, "rejected")}><X className="mr-1 h-4 w-4" />Odrzuć</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function Loading() { return <div className="flex justify-center py-10"><div className="h-7 w-7 animate-spin rounded-full border-2 border-red-500 border-t-transparent" /></div>; }
function Empty({ text }: { text: string }) { return <p className="py-10 text-center text-sm text-muted-foreground">{text}</p>; }
