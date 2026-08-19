"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, MapPin, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Incident { id: number; userName: string; date: string; type: string; description: string; severity: "info" | "minor" | "major" | "critical"; location: string | null; mileage: number | null; actionTaken: string | null; isResolved: boolean; }
const severity = { info: ["Informacja", "bg-blue-600"], minor: ["Drobne", "bg-amber-600"], major: ["Poważne", "bg-orange-600"], critical: ["Krytyczne", "bg-red-600"] } as const;
const types: Record<string, string> = { uszkodzenie: "Uszkodzenie pojazdu", awaria: "Awaria mechaniczna", kolizja: "Kolizja / wypadek", opona: "Problem z oponą", elektryka: "Usterka elektryczna", inne: "Inne" };

export function MeldunkiAdminClient() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filter, setFilter] = useState("open");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/incidents").then((response) => response.json()).then((data) => setIncidents(data.incidents ?? [])).finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => filter === "all" ? incidents : incidents.filter((incident) => !incident.isResolved), [filter, incidents]);

  async function toggleResolved(incident: Incident) {
    setUpdating(incident.id);
    const response = await fetch("/api/incidents", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ incidentId: incident.id, isResolved: !incident.isResolved }) });
    if (response.ok) setIncidents((current) => current.map((item) => item.id === incident.id ? { ...item, isResolved: !item.isResolved } : item));
    setUpdating(null);
  }

  return (
    <>
      <PageHeader title="Meldunki" description="Zgłoszenia usterek i zdarzeń pojazdu" />
      <div className="space-y-4 p-4">
        <Tabs value={filter} onValueChange={setFilter}><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="open">Otwarte ({incidents.filter((item) => !item.isResolved).length})</TabsTrigger><TabsTrigger value="all">Wszystkie ({incidents.length})</TabsTrigger></TabsList></Tabs>
        {loading ? <div className="flex justify-center py-10"><div className="h-7 w-7 animate-spin rounded-full border-2 border-red-500 border-t-transparent" /></div> : visible.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">{filter === "open" ? "Brak otwartych meldunków" : "Brak meldunków"}</p> : (
          <div className="space-y-3">{visible.map((incident) => <Card key={incident.id} className={cn(incident.isResolved && "opacity-65")}><CardContent className="space-y-3 p-3"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-medium">{types[incident.type] ?? incident.type}</p><p className="text-xs text-muted-foreground">{incident.userName} · {incident.date}</p></div><Badge className={cn("text-white", severity[incident.severity][1])}>{severity[incident.severity][0]}</Badge></div><p className="text-sm text-muted-foreground">{incident.description}</p>{incident.location && <p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{incident.location}</p>}{incident.actionTaken && <div className="rounded-md bg-muted p-2 text-xs"><span className="font-medium">Podjęte działania: </span>{incident.actionTaken}</div>}<Button variant={incident.isResolved ? "outline" : "default"} className={cn("w-full", !incident.isResolved && "bg-emerald-700 hover:bg-emerald-800")} disabled={updating === incident.id} onClick={() => toggleResolved(incident)}>{incident.isResolved ? <RotateCcw className="mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}{incident.isResolved ? "Otwórz ponownie" : "Oznacz jako rozwiązane"}</Button></CardContent></Card>)}</div>
        )}
        <div className="flex items-center gap-2 rounded-md border p-3 text-xs text-muted-foreground"><AlertTriangle className="h-4 w-4 shrink-0" />Krytyczne meldunki pozostają widoczne do ręcznego zamknięcia.</div>
      </div>
    </>
  );
}
