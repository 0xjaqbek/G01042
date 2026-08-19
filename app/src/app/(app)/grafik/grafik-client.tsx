"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, BriefcaseBusiness, ChevronLeft, ChevronRight, Loader2, Plus, Trash2, UserRound, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type ShiftType = "D" | "N" | "DN";

interface ScheduleEntry {
  id: number;
  userId: number;
  userName: string;
  date: string;
  shiftType: ShiftType;
  shiftFunction: "K" | "R";
}

interface ExternalShift {
  id: number;
  userId: number;
  date: string;
  shiftType: ShiftType;
  workplace: string;
  notes: string | null;
}

const SHIFT_COLORS: Record<string, string> = {
  "D-K": "bg-blue-600 text-white",
  "D-R": "bg-sky-500 text-white",
  "N-K": "bg-indigo-700 text-white",
  "N-R": "bg-violet-600 text-white",
  "DN-K": "bg-red-700 text-white",
  "DN-R": "bg-rose-500 text-white",
};
const DAY_NAMES_SHORT = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "Sb"];
const MONTH_NAMES = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];

export function GrafikClient({ userId, initialYear, initialMonth }: { userId: string; initialYear: number; initialMonth: number }) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [externalShifts, setExternalShifts] = useState<ExternalShift[]>([]);
  const [view, setView] = useState<"team" | "mine">("team");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ date: formatDate(initialYear, initialMonth, 1), shiftType: "D" as ShiftType, workplace: "", notes: "" });

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch(`/api/schedule?year=${year}&month=${month}`).then((response) => response.json()),
      fetch(`/api/external-shifts?year=${year}&month=${month}`).then((response) => response.json()),
    ])
      .then(([scheduleData, externalData]) => {
        if (!active) return;
        setEntries(scheduleData.entries ?? []);
        setExternalShifts(externalData.entries ?? []);
      })
      .catch(() => active && setError("Nie udało się pobrać grafiku."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [year, month]);

  const days = Array.from({ length: new Date(year, month, 0).getDate() }, (_, index) => index + 1);
  const userMap = useMemo(() => {
    const map = new Map<number, { name: string; shifts: Map<number, ScheduleEntry> }>();
    for (const entry of entries) {
      if (!map.has(entry.userId)) map.set(entry.userId, { name: entry.userName, shifts: new Map() });
      map.get(entry.userId)?.shifts.set(Number(entry.date.slice(8, 10)), entry);
    }
    return map;
  }, [entries]);
  const externalByDay = useMemo(() => {
    const map = new Map<number, ExternalShift[]>();
    for (const entry of externalShifts) {
      const day = Number(entry.date.slice(8, 10));
      map.set(day, [...(map.get(day) ?? []), entry]);
    }
    return map;
  }, [externalShifts]);
  const ownLocalDates = new Set(entries.filter((entry) => entry.userId === Number(userId)).map((entry) => entry.date));
  const conflictDates = new Set(externalShifts.filter((entry) => ownLocalDates.has(entry.date) || (externalByDay.get(Number(entry.date.slice(8, 10)))?.length ?? 0) > 1).map((entry) => entry.date));
  const monthStart = formatDate(year, month, 1);
  const monthEnd = formatDate(year, month, days.length);
  const visibleUsers = view === "mine"
    ? Array.from(userMap.entries()).filter(([id]) => id === Number(userId))
    : Array.from(userMap.entries());

  function changeMonth(delta: number) {
    const date = new Date(year, month - 1 + delta, 1);
    setLoading(true);
    setError(null);
    setYear(date.getFullYear());
    setMonth(date.getMonth() + 1);
  }

  function openAddDialog() {
    setForm({ date: monthStart, shiftType: "D", workplace: "", notes: "" });
    setError(null);
    setDialogOpen(true);
  }

  async function addExternalShift(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const response = await fetch("/api/external-shifts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json();
    if (response.ok) {
      setExternalShifts((current) => [...current, data.entry]);
      setDialogOpen(false);
    } else setError(data.error ?? "Nie udało się dodać dyżuru.");
    setSaving(false);
  }

  async function deleteExternalShift(id: number) {
    const response = await fetch(`/api/external-shifts?id=${id}`, { method: "DELETE" });
    if (response.ok) setExternalShifts((current) => current.filter((entry) => entry.id !== id));
    else setError("Nie udało się usunąć dyżuru.");
  }

  return <>
    <PageHeader title="Grafik dyżurów" />
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)} aria-label="Poprzedni miesiąc"><ChevronLeft /></Button>
        <h2 className="text-lg font-semibold">{MONTH_NAMES[month - 1]} {year}</h2>
        <Button variant="ghost" size="icon" onClick={() => changeMonth(1)} aria-label="Następny miesiąc"><ChevronRight /></Button>
      </div>

      <div className="grid grid-cols-2 rounded-md bg-muted p-1">
        <Button size="sm" variant={view === "team" ? "secondary" : "ghost"} onClick={() => setView("team")} aria-pressed={view === "team"}><Users className="mr-1.5 h-4 w-4" />Zespół</Button>
        <Button size="sm" variant={view === "mine" ? "secondary" : "ghost"} onClick={() => setView("mine")} aria-pressed={view === "mine"}><UserRound className="mr-1.5 h-4 w-4" />Moje dyżury</Button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">{Object.entries(SHIFT_COLORS).map(([key, color]) => <Badge key={key} className={cn(color, "text-[10px]")}>{key}</Badge>)}<Badge className="bg-teal-600 text-[10px] text-white">Inne miejsce</Badge></div>
        <Button size="sm" className="shrink-0" onClick={openAddDialog}><Plus className="mr-1 h-4 w-4" />Dodaj</Button>
      </div>

      {error && <div className="rounded-md border border-red-700/50 bg-red-950/20 px-3 py-2 text-xs text-red-300">{error}</div>}

      {loading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-red-500" /></div> : <div className="overflow-x-auto rounded-md border border-border">
        <table className="min-w-[720px] w-full text-xs">
          <thead><tr className="border-b border-border bg-muted/40"><th className="sticky left-0 z-20 min-w-32 bg-muted px-2 py-2 text-left font-medium">Pracownik</th>{days.map((day) => { const date = new Date(year, month - 1, day); const weekend = date.getDay() === 0 || date.getDay() === 6; return <th key={day} className={cn("min-w-9 px-0.5 py-1 text-center", weekend && "text-red-400")}><span className="block">{day}</span><span className="text-[10px] font-normal text-muted-foreground">{DAY_NAMES_SHORT[date.getDay()]}</span></th>; })}</tr></thead>
          <tbody>
            {visibleUsers.map(([id, data]) => <tr key={id} className={cn("border-b border-border/50", id === Number(userId) && "bg-primary/5")}><td className="sticky left-0 z-10 max-w-32 truncate bg-background px-2 py-1.5 font-medium">{data.name}</td>{days.map((day) => { const shift = data.shifts.get(day); if (!shift) return <td key={day} className="border-l border-border/20 p-0.5" />; const label = `${shift.shiftType}-${shift.shiftFunction}`; return <td key={day} className="border-l border-border/20 p-0.5"><div className={cn("rounded-sm px-0.5 py-1 text-center text-[10px] font-semibold", SHIFT_COLORS[label])}>{label}</div></td>; })}</tr>)}
            <tr className="bg-teal-950/15"><td className="sticky left-0 z-10 bg-background px-2 py-2 font-medium text-teal-400">Moje inne miejsca</td>{days.map((day) => { const shifts = externalByDay.get(day) ?? []; const conflict = shifts.some((shift) => conflictDates.has(shift.date)); return <td key={day} className="border-l border-border/20 p-0.5">{shifts.map((shift) => <div key={shift.id} title={shift.workplace} className={cn("mb-0.5 rounded-sm bg-teal-600 px-0.5 py-1 text-center text-[10px] font-semibold text-white last:mb-0", conflict && "bg-red-700 ring-1 ring-red-400")}>{shift.shiftType}*</div>)}</td>; })}</tr>
          </tbody>
        </table>
      </div>}

      {entries.length === 0 && !loading && <p className="text-center text-xs text-muted-foreground">Grafik G01042 na ten miesiąc nie został jeszcze opublikowany.</p>}

      <Card size="sm">
        <CardHeader className="flex-row items-center justify-between"><CardTitle>Moje dyżury z innych miejsc</CardTitle><BriefcaseBusiness className="h-4 w-4 text-muted-foreground" /></CardHeader>
        <CardContent className="space-y-2">
          {externalShifts.length === 0 ? <p className="py-3 text-center text-xs text-muted-foreground">Brak dodanych dyżurów</p> : [...externalShifts].sort((a, b) => a.date.localeCompare(b.date)).map((shift) => {
            const conflict = conflictDates.has(shift.date);
            return <div key={shift.id} className={cn("flex items-center gap-2 rounded-md border px-2 py-2", conflict && "border-red-700/60 bg-red-950/20")}>
              <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-sm bg-teal-600 text-[10px] font-semibold text-white"><span>{Number(shift.date.slice(8, 10))}</span><span>{shift.shiftType}</span></div>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{shift.workplace}</p><p className="truncate text-xs text-muted-foreground">{shift.notes || `${shift.shiftType === "DN" ? 24 : 12} h`}</p></div>
              {conflict && <Badge className="bg-red-700"><AlertTriangle className="mr-1 h-3 w-3" />Kolizja</Badge>}
              <Button variant="ghost" size="icon-sm" aria-label={`Usuń dyżur ${shift.workplace}`} onClick={() => deleteExternalShift(shift.id)}><Trash2 /></Button>
            </div>;
          })}
        </CardContent>
      </Card>
    </div>

    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent>
        <form onSubmit={addExternalShift} className="space-y-4">
          <DialogHeader><DialogTitle>Dyżur z innego miejsca</DialogTitle><DialogDescription>Dodaj go do swojego wspólnego widoku grafiku.</DialogDescription></DialogHeader>
          <div className="space-y-2"><Label htmlFor="external-workplace">Miejsce pracy</Label><Input id="external-workplace" value={form.workplace} maxLength={100} required placeholder="np. ZRM Kartuzy" onChange={(event) => setForm((current) => ({ ...current, workplace: event.target.value }))} /></div>
          <div className="grid grid-cols-[1fr_96px] gap-3">
            <div className="space-y-2"><Label htmlFor="external-date">Data</Label><Input id="external-date" type="date" min={monthStart} max={monthEnd} value={form.date} required onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} /></div>
            <div className="space-y-2"><Label>Zmiana</Label><Select value={form.shiftType} onValueChange={(value) => setForm((current) => ({ ...current, shiftType: (value ?? "D") as ShiftType }))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="D">D · 12 h</SelectItem><SelectItem value="N">N · 12 h</SelectItem><SelectItem value="DN">DN · 24 h</SelectItem></SelectContent></Select></div>
          </div>
          <div className="space-y-2"><Label htmlFor="external-notes">Notatka</Label><Textarea id="external-notes" value={form.notes} maxLength={500} placeholder="Opcjonalnie" onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /></div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Anuluj</Button><Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Dodaj dyżur</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </>;
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
