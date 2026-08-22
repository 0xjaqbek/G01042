"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, CalendarCheck, CalendarRange, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock, History, Loader2, RotateCcw, Send, Sparkles, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { SHIFT_CODES, formatDate, getAllowedShiftCodes, getCoverage, getCoverageIssueDates, getMemberHours, getRestConflicts, splitShiftCode, toShiftCode, type ScheduleDraftEntry, type ShiftCode, type ShiftFunction, type ShiftType, type TeamMember } from "@/lib/schedule-rules";
import { analyzeProposalDemand, getFairnessStats, suggestAssignments, type DayDemand, type MemberFairness } from "@/lib/schedule-solver";

const MONTHS = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
const DAYS = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "Sb"];
const SHIFT_COLORS: Record<ShiftCode, string> = {
  "D-K": "bg-blue-600 text-white",
  "D-R": "bg-sky-500 text-white",
  "N-K": "bg-indigo-700 text-white",
  "N-R": "bg-violet-600 text-white",
  "DN-K": "bg-red-700 text-white",
  "DN-R": "bg-rose-500 text-white",
};
const STATUS = {
  draft: { label: "Szkic", className: "bg-zinc-600" },
  submitted: { label: "Do decyzji", className: "bg-amber-600" },
  approved: { label: "Zatwierdzone", className: "bg-emerald-600" },
  rejected: { label: "Odrzucone", className: "bg-red-600" },
} as const;

interface Proposal {
  id: number;
  userId: number;
  userName: string;
  userRole: string;
  status: keyof typeof STATUS;
  hours: number;
  entries: { day: number; shift: string }[];
}

interface ChangelogEntry {
  id: number;
  publishedByName: string;
  changes: string;
  publishedAt: string;
}

interface PublishedEntry extends ScheduleDraftEntry { id: number; userName: string }

export function GrafikAdminClient() {
  const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
  const [year, setYear] = useState(nextMonth.getFullYear());
  const [month, setMonth] = useState(nextMonth.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(1);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [draft, setDraft] = useState<ScheduleDraftEntry[]>([]);
  const [publishedEntries, setPublishedEntries] = useState<ScheduleDraftEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [changelogLoading, setChangelogLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch(`/api/admin/proposals?year=${year}&month=${month}`).then((response) => response.json()),
      fetch(`/api/schedule?year=${year}&month=${month}`).then((response) => response.json()),
    ])
      .then(([proposalData, scheduleData]) => {
        if (!active) return;
        const loadedEntries = (scheduleData.entries ?? []).map((entry: PublishedEntry) => ({ userId: entry.userId, date: entry.date, shiftType: entry.shiftType, shiftFunction: entry.shiftFunction }));
        setProposals(proposalData.proposals ?? []);
        setTeam(proposalData.team ?? []);
        setPublishedEntries(loadedEntries);
        setDraft(loadedEntries);
      })
      .catch(() => active && setMessage({ type: "error", text: "Nie udało się pobrać danych grafiku." }))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [year, month]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const approvedProposals = proposals.filter((proposal) => proposal.status === "approved");
  const coverageIssueDays = useMemo(() => getCoverageIssueDates(draft, year, month), [draft, year, month]);
  const restConflicts = useMemo(() => getRestConflicts(draft), [draft]);
  const overLimit = team.filter((member) => getMemberHours(draft, member.id) > ((member as any).maxHours ?? 240));
  const underLimit = team.filter((member) => getMemberHours(draft, member.id) < ((member as any).minHours ?? 120));
  const canPublish = draft.length > 0 && coverageIssueDays.length === 0 && restConflicts.length === 0 && overLimit.length === 0 && underLimit.length === 0;
  const submitted = proposals.filter((proposal) => proposal.status === "submitted").length;
  const selectedDate = formatDate(year, month, selectedDay);
  const coverage = getCoverage(draft, selectedDate);

  const approvedByMemberDay = useMemo(() => {
    const map = new Map<string, string>();
    for (const proposal of approvedProposals) {
      for (const entry of proposal.entries) map.set(`${proposal.userId}:${entry.day}`, entry.shift);
    }
    return map;
  }, [approvedProposals]);

  const activeProposals = useMemo(() => proposals.filter((p) => p.status === "submitted" || p.status === "approved"), [proposals]);
  const demand = useMemo(() => analyzeProposalDemand(activeProposals.map((p) => ({ userId: p.userId, entries: p.entries })), team, year, month), [activeProposals, team, year, month]);
  const fairness = useMemo(() => getFairnessStats(team, draft), [team, draft]);
  const suggestions = useMemo(() => showSuggestions ? suggestAssignments(team, draft, year, month) : [], [showSuggestions, team, draft, year, month]);
  const selectedDemand = demand.find((d) => d.day === selectedDay);

  function changeMonth(delta: number) {
    const date = new Date(year, month - 1 + delta, 1);
    setLoading(true);
    setMessage(null);
    setYear(date.getFullYear());
    setMonth(date.getMonth() + 1);
    setSelectedDay(1);
  }

  function loadChangelog() {
    setChangelogLoading(true);
    fetch(`/api/schedule/changelog?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((data) => setChangelog(data.entries ?? []))
      .catch(() => {})
      .finally(() => setChangelogLoading(false));
  }

  async function setStatus(proposalId: number, status: "approved" | "rejected") {
    setUpdatingId(proposalId);
    const response = await fetch("/api/admin/proposals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ proposalId, status }) });
    if (response.ok) setProposals((current) => current.map((proposal) => proposal.id === proposalId ? { ...proposal, status } : proposal));
    setUpdatingId(null);
  }

  function importApproved() {
    const imported = approvedProposals.flatMap((proposal) => {
      const member = team.find((m) => m.id === proposal.userId);
      const fn = member?.role === "ratownik" ? "R" : "K";
      return proposal.entries.map((entry) => ({
        userId: proposal.userId,
        date: formatDate(year, month, entry.day),
        shiftType: entry.shift as ShiftType,
        shiftFunction: fn as ShiftFunction,
      }));
    });
    setDraft(imported);
    setMessage({ type: "success", text: `Wczytano ${imported.length} dyżurów z zatwierdzonych propozycji.` });
  }

  function setAssignment(userId: number, code: ShiftCode | "NONE") {
    setDraft((current) => {
      const withoutCurrent = current.filter((entry) => !(entry.userId === userId && entry.date === selectedDate));
      return code === "NONE" ? withoutCurrent : [...withoutCurrent, { userId, date: selectedDate, ...splitShiftCode(code) }];
    });
    setMessage(null);
  }

  function acceptSuggestion(s: ScheduleDraftEntry) {
    setDraft((prev) => [...prev, s]);
  }

  async function publish() {
    if (!canPublish) return;
    setPublishing(true);
    setMessage(null);
    const response = await fetch("/api/schedule", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ year, month, entries: draft }) });
    const data = await response.json();
    if (response.ok) {
      setPublishedEntries(draft);
      setMessage({ type: "success", text: "Grafik został opublikowany i jest widoczny dla zespołu." });
    } else setMessage({ type: "error", text: data.error ?? "Nie udało się opublikować grafiku." });
    setPublishing(false);
  }

  return <>
    <PageHeader title="Propozycje grafiku" description="Weryfikacja i układanie grafiku zespołu" />
    <div className="space-y-4 p-4">
      <MonthNavigation year={year} month={month} submitted={submitted} onChange={changeMonth} />
      <Tabs defaultValue="creator">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="creator" className="text-xs"><Sparkles />Kreator</TabsTrigger>
          <TabsTrigger value="preview" className="text-xs"><CalendarRange />Podgląd</TabsTrigger>
          <TabsTrigger value="proposals" className="text-xs">Propozycje {submitted > 0 && <Badge className="ml-1 h-5 bg-amber-600 px-1.5">{submitted}</Badge>}</TabsTrigger>
          <TabsTrigger value="changelog" className="text-xs" onClick={loadChangelog}><History />Historia</TabsTrigger>
        </TabsList>

        <TabsContent value="creator" className="space-y-4">
          {loading ? <Loading /> : <>
            <div className={cn("grid gap-2", showSuggestions ? "grid-cols-4" : "grid-cols-3")}>
              <Metric label="Dyżury" value={draft.length} />
              <Metric label="Dni do poprawy" value={coverageIssueDays.length} alert={coverageIssueDays.length > 0} />
              <Metric label="Konflikty" value={restConflicts.length} alert={restConflicts.length > 0} />
              {showSuggestions && <Metric label="Sugestie" value={suggestions.length} />}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" onClick={importApproved} disabled={approvedProposals.length === 0}><Sparkles className="mr-1 h-4 w-4" />Wczytaj</Button>
              <Button variant="outline" onClick={() => setDraft(publishedEntries)} disabled={publishedEntries.length === 0}><RotateCcw className="mr-1 h-4 w-4" />Przywróć</Button>
              <Button variant={showSuggestions ? "default" : "outline"} onClick={() => { setShowSuggestions((p) => !p); setReviewIndex(null); }}><Sparkles className="mr-1 h-4 w-4" />Sugestie</Button>
            </div>
            {showSuggestions && suggestions.length > 0 && reviewIndex === null && (
              <Button variant="outline" className="w-full border-emerald-700/50 text-emerald-400 hover:bg-emerald-950/20" onClick={() => setReviewIndex(0)}>
                <Check className="mr-1 h-4 w-4" />Sprawdź sugestie ({suggestions.length})
              </Button>
            )}
            {reviewIndex !== null && (() => {
              const s = suggestions[reviewIndex];
              if (!s) return <Notice type="success">Koniec sugestii — sprawdzono wszystkie.</Notice>;
              const member = team.find((m) => m.id === s.userId);
              const dayNum = parseInt(s.date.slice(8, 10));
              const code = toShiftCode(s);
              return <Card size="sm" className="border-emerald-700/50 bg-emerald-950/10">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Sugestia {reviewIndex + 1} z {suggestions.length}</p>
                    <button onClick={() => setReviewIndex(null)} className="text-xs text-muted-foreground hover:text-foreground">Zamknij</button>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={cn(SHIFT_COLORS[code])}>{code}</Badge>
                    <div>
                      <p className="text-sm font-medium">{member?.name ?? `ID ${s.userId}`}</p>
                      <p className="text-xs text-muted-foreground">{dayNum} {MONTHS[month - 1].toLowerCase()}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800" onClick={() => { acceptSuggestion(s); setReviewIndex((i) => i ?? 0); }}><Check className="mr-1 h-4 w-4" />Akceptuj</Button>
                    <Button size="sm" variant="outline" onClick={() => setReviewIndex((i) => (i ?? 0) + 1)}><X className="mr-1 h-4 w-4" />Pomiń</Button>
                  </div>
                </CardContent>
              </Card>;
            })()}
            {message && <Notice type={message.type}>{message.text}</Notice>}
            <DayPicker year={year} month={month} days={daysInMonth} selectedDay={selectedDay} issueDays={coverageIssueDays} demand={demand} onSelect={setSelectedDay} />
            <Card size="sm">
              <CardHeader><CardTitle>{selectedDay} {MONTHS[month - 1].toLowerCase()}</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                {selectedDemand && selectedDemand.total > 0 && (
                  <p className="col-span-2 text-[11px] text-muted-foreground mb-1">
                    Propozycje: {selectedDemand.dayK.length + selectedDemand.nightK.length} K, {selectedDemand.dayR.length + selectedDemand.nightR.length} R
                    {(selectedDemand.dayK.length > 1 || selectedDemand.nightK.length > 1 || selectedDemand.dayR.length > 1 || selectedDemand.nightR.length > 1) && (
                      <span className="text-amber-500 ml-1">· nadwyżka</span>
                    )}
                  </p>
                )}
                <CoverageStatus label="Dzień · kierowca" count={coverage.dayK} />
                <CoverageStatus label="Dzień · ratownik" count={coverage.dayR} />
                <CoverageStatus label="Noc · kierowca" count={coverage.nightK} />
                <CoverageStatus label="Noc · ratownik" count={coverage.nightR} />
              </CardContent>
            </Card>
            <Card size="sm">
              <CardHeader><CardTitle>Obsada</CardTitle></CardHeader>
              <CardContent className="divide-y divide-border px-0">
                {team.map((member) => {
                  const assignment = draft.find((entry) => entry.userId === member.id && entry.date === selectedDate);
                  const code = assignment ? toShiftCode(assignment) : "NONE";
                  const proposed = approvedByMemberDay.get(`${member.id}:${selectedDay}`);
                  const changed = proposed && code !== "NONE" && !code.startsWith(proposed);
                  const memberSuggestion = suggestions.find((s) => s.userId === member.id && s.date === selectedDate);
                  return <div key={member.id} className="flex min-h-14 items-center gap-3 px-3 py-2">
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{member.name}</p><p className={cn("text-xs text-muted-foreground", changed && "text-amber-500")}>{proposed ? (changed ? `Propozycja: ${proposed}` : "Zgodnie z propozycją") : "Brak zatwierdzonej propozycji"}</p></div>
                    {memberSuggestion && code === "NONE" && (
                      <button onClick={() => setAssignment(member.id, toShiftCode(memberSuggestion))} className="shrink-0 text-[10px] px-2 py-1 rounded border border-dashed border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">{toShiftCode(memberSuggestion)}</button>
                    )}
                    <Select value={code} onValueChange={(value) => setAssignment(member.id, (value ?? "NONE") as ShiftCode | "NONE")}>
                      <SelectTrigger className="w-24"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="NONE">Wolne</SelectItem>{getAllowedShiftCodes(member.role).map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>;
                })}
              </CardContent>
            </Card>
            <FairnessPanel stats={fairness} conflicts={restConflicts} />
            <Card size="sm"><CardHeader><CardTitle>Zasady kontroli</CardTitle></CardHeader><CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>Dzień i noc wymagają dokładnie jednego kierowcy oraz jednego ratownika.</p><p>D i N liczą po 12 h. DN liczy 24 h i obsadza obie zmiany.</p><p>Konflikt 36 h: po DN nie może być D ani DN następnego dnia; po N nie może być DN.</p><p>Niedobór godzin jest ostrzeżeniem. Nadmiar ponad maksimum oraz konflikty blokują publikację.</p>
            </CardContent></Card>
            <Button className="w-full bg-emerald-700 hover:bg-emerald-800" disabled={!canPublish || publishing} onClick={publish}>{publishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Opublikuj grafik</Button>
            {!canPublish && <p className="text-center text-xs text-muted-foreground">Uzupełnij obsadę i usuń konflikty oraz przekroczenia godzin.</p>}
            <Link href={`/grafik?year=${year}&month=${month}`} className={buttonVariants({ variant: "outline", className: "w-full" })}><CalendarCheck className="mr-2 h-4 w-4" />Otwórz opublikowany grafik</Link>
          </>}
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          {loading ? <Loading /> : <DraftPreview year={year} month={month} team={team} entries={draft} issueDays={coverageIssueDays} />}
        </TabsContent>

        <TabsContent value="proposals">
          {loading ? <Loading /> : proposals.length === 0 ? <Empty text="Brak propozycji na wybrany miesiąc" /> : <div className="space-y-3">{proposals.map((proposal) => <ProposalCard key={proposal.id} proposal={proposal} updating={updatingId === proposal.id} onStatus={setStatus} />)}</div>}
        </TabsContent>

        <TabsContent value="changelog" className="space-y-3">
          {changelogLoading ? <Loading /> : changelog.length === 0 ? <Empty text="Brak historii publikacji" /> : changelog.map((entry) => <ChangelogCard key={entry.id} entry={entry} />)}
        </TabsContent>
      </Tabs>
    </div>
  </>;
}

function MonthNavigation({ year, month, submitted, onChange }: { year: number; month: number; submitted: number; onChange: (delta: number) => void }) {
  return <div className="flex items-center justify-between"><Button variant="ghost" size="icon" onClick={() => onChange(-1)} aria-label="Poprzedni miesiąc"><ChevronLeft /></Button><div className="text-center"><h2 className="font-semibold">{MONTHS[month - 1]} {year}</h2><p className="text-xs text-muted-foreground">{submitted} oczekuje na decyzję</p></div><Button variant="ghost" size="icon" onClick={() => onChange(1)} aria-label="Następny miesiąc"><ChevronRight /></Button></div>;
}

function DayPicker({ year, month, days, selectedDay, issueDays, demand, onSelect }: { year: number; month: number; days: number; selectedDay: number; issueDays: number[]; demand: DayDemand[]; onSelect: (day: number) => void }) {
  return <div className="-mx-4 overflow-x-auto overflow-y-visible px-4 pb-2 pt-3"><div className="flex w-max gap-1.5">{Array.from({ length: days }, (_, index) => index + 1).map((day) => { const dayName = DAYS[new Date(year, month - 1, day).getDay()]; const issue = issueDays.includes(day); const dayDemand = demand.find((d) => d.day === day); return <button key={day} onClick={() => onSelect(day)} className={cn("relative flex h-16 w-12 shrink-0 flex-col items-center justify-center rounded-md border text-xs", selectedDay === day ? "border-red-500 bg-red-500/15" : "border-border bg-card", issue && "after:absolute after:right-1 after:top-1 after:h-1.5 after:w-1.5 after:rounded-full after:bg-amber-500")}><span className="font-semibold">{day}</span><span className="text-[10px] text-muted-foreground">{dayName}</span>{dayDemand && dayDemand.total > 0 && <span className="absolute -top-1.5 -left-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-sky-600 text-[7px] font-bold text-white">{dayDemand.total}</span>}</button>; })}</div></div>;
}

function CoverageStatus({ label, count }: { label: string; count: number }) {
  const ok = count === 1;
  return <div className={cn("flex items-center justify-between rounded-md border px-2 py-2 text-xs", ok ? "border-emerald-700/50 bg-emerald-950/20" : "border-amber-600/50 bg-amber-950/20")}><span>{label}</span><span className="flex items-center gap-1 font-semibold">{ok ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}{count}/1</span></div>;
}

function FairnessPanel({ stats, conflicts }: { stats: MemberFairness[]; conflicts: ReturnType<typeof getRestConflicts> }) {
  return <Card size="sm"><CardHeader><CardTitle>Sprawiedliwość</CardTitle></CardHeader><CardContent className="space-y-2.5">{stats.map((m) => {
    const hasConflict = conflicts.some((c) => c.userId === m.id);
    const state = m.hours > m.maxHours ? "over" : m.hours < m.minHours ? "under" : "ok";
    return <div key={m.id} className="space-y-1">
      <div className="flex items-center gap-2 text-xs">
        <span className="min-w-0 flex-1 truncate font-medium">{m.name}</span>
        {hasConflict && <Badge className="bg-red-700 text-[10px]">36h</Badge>}
        <span className={cn("tabular-nums font-semibold", state === "over" && "text-red-500", state === "under" && "text-amber-500", state === "ok" && "text-emerald-500")}>{m.hours}h</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
          <div className={cn("h-full rounded-full transition-all", state === "over" ? "bg-red-500" : state === "under" ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${Math.min(m.loadRatio * 100, 100)}%` }} />
        </div>
        <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{m.nightCount}N {m.weekendCount}W</span>
      </div>
    </div>;
  })}</CardContent></Card>;
}

function DraftPreview({ year, month, team, entries, issueDays }: { year: number; month: number; team: TeamMember[]; entries: ScheduleDraftEntry[]; issueDays: number[] }) {
  const days = Array.from({ length: new Date(year, month, 0).getDate() }, (_, index) => index + 1);
  const assignments = new Map(entries.map((entry) => [`${entry.userId}:${entry.date}`, entry]));

  return <>
    <div className="flex flex-wrap gap-1.5">{SHIFT_CODES.map((code) => <Badge key={code} className={cn("text-[10px]", SHIFT_COLORS[code])}>{code}</Badge>)}</div>
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="min-w-[1180px] border-collapse text-[10px]">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="sticky left-0 z-20 min-w-36 bg-muted px-2 py-2 text-left text-xs font-medium">Pracownik</th>
            {days.map((day) => {
              const date = new Date(year, month - 1, day);
              const weekend = date.getDay() === 0 || date.getDay() === 6;
              return <th key={day} className={cn("w-8 min-w-8 px-0.5 py-1 text-center font-medium", weekend && "text-red-400")}><span className="block text-xs">{day}</span><span className="font-normal text-muted-foreground">{DAYS[date.getDay()]}</span></th>;
            })}
          </tr>
        </thead>
        <tbody>
          {team.map((member) => <tr key={member.id} className="border-b border-border/50 last:border-b-0">
            <td className="sticky left-0 z-10 max-w-36 truncate bg-background px-2 py-1.5 text-xs font-medium">{member.name}</td>
            {days.map((day) => {
              const entry = assignments.get(`${member.id}:${formatDate(year, month, day)}`);
              if (!entry) return <td key={day} className="border-l border-border/30 p-0.5" />;
              const code = toShiftCode(entry);
              return <td key={day} className="border-l border-border/30 p-0.5"><div className={cn("flex h-6 items-center justify-center rounded-sm font-semibold", SHIFT_COLORS[code])}>{code}</div></td>;
            })}
          </tr>)}
          <tr className="border-t border-border bg-muted/30">
            <td className="sticky left-0 z-10 bg-muted px-2 py-2 text-xs font-medium">Obsada</td>
            {days.map((day) => {
              const issue = issueDays.includes(day);
              return <td key={day} className="border-l border-border/30 p-0.5 text-center"><span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-sm font-bold", issue ? "bg-amber-500/20 text-amber-500" : "bg-emerald-500/20 text-emerald-500")}>{issue ? "!" : "✓"}</span></td>;
            })}
          </tr>
        </tbody>
      </table>
    </div>
    <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground"><span>{entries.length} dyżurów w szkicu</span><span className={cn(issueDays.length > 0 ? "text-amber-500" : "text-emerald-500")}>{issueDays.length > 0 ? `${issueDays.length} dni wymaga poprawy` : "Obsada kompletna"}</span></div>
  </>;
}

function ProposalCard({ proposal, updating, onStatus }: { proposal: Proposal; updating: boolean; onStatus: (id: number, status: "approved" | "rejected") => void }) {
  const status = STATUS[proposal.status];
  return <Card><CardContent className="space-y-3 p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium">{proposal.userName}</p><p className="text-xs text-muted-foreground">{proposal.userRole === "kierowca" ? "Kierowca" : "Ratownik"}</p></div><Badge className={cn("text-white", status.className)}>{status.label}</Badge></div><div className="flex items-center gap-4 text-xs text-muted-foreground"><span>{proposal.entries.length} zmian</span><span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{proposal.hours} h</span></div><div className="flex flex-wrap gap-1.5">{proposal.entries.map((entry) => <Badge key={`${entry.day}-${entry.shift}`} variant="secondary">{entry.day}: {entry.shift}</Badge>)}</div><div className="grid grid-cols-2 gap-2"><Button size="sm" className="bg-emerald-700 hover:bg-emerald-800" disabled={updating || proposal.status === "approved"} onClick={() => onStatus(proposal.id, "approved")}><Check className="mr-1 h-4 w-4" />Zatwierdź</Button><Button size="sm" variant="outline" disabled={updating || proposal.status === "rejected"} onClick={() => onStatus(proposal.id, "rejected")}><X className="mr-1 h-4 w-4" />Odrzuć</Button></div></CardContent></Card>;
}

function ChangelogCard({ entry }: { entry: ChangelogEntry }) {
  const data = JSON.parse(entry.changes) as {
    added?: { userName: string; date: string; shift: string }[];
    removed?: { userName: string; date: string; shift: string }[];
    modified?: { userName: string; date: string; from: string; to: string }[];
    isFirst?: boolean;
    totalEntries?: number;
  };
  const time = new Date(entry.publishedAt);
  const dateStr = `${time.getDate().toString().padStart(2, "0")}.${(time.getMonth() + 1).toString().padStart(2, "0")}.${time.getFullYear()}`;
  const timeStr = `${time.getHours().toString().padStart(2, "0")}:${time.getMinutes().toString().padStart(2, "0")}`;
  const formatDay = (d: string) => { const day = parseInt(d.slice(8, 10)); return day; };

  return (
    <Card size="sm">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{entry.publishedByName}</p>
          <span className="text-xs text-muted-foreground">{dateStr}, {timeStr}</span>
        </div>
        {data.isFirst ? (
          <p className="text-xs text-emerald-400">Pierwsza publikacja — {data.totalEntries} dyżurów</p>
        ) : (
          <div className="space-y-1.5">
            {(data.added?.length ?? 0) > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-emerald-400 mb-0.5">+ Dodano ({data.added!.length})</p>
                <div className="flex flex-wrap gap-1">{data.added!.map((c, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px] bg-emerald-950/40 text-emerald-300">{c.userName.split(" ")[0]} {formatDay(c.date)}: {c.shift}</Badge>
                ))}</div>
              </div>
            )}
            {(data.removed?.length ?? 0) > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-red-400 mb-0.5">− Usunięto ({data.removed!.length})</p>
                <div className="flex flex-wrap gap-1">{data.removed!.map((c, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px] bg-red-950/40 text-red-300">{c.userName.split(" ")[0]} {formatDay(c.date)}: {c.shift}</Badge>
                ))}</div>
              </div>
            )}
            {(data.modified?.length ?? 0) > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-amber-400 mb-0.5">~ Zmieniono ({data.modified!.length})</p>
                <div className="flex flex-wrap gap-1">{data.modified!.map((c, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px] bg-amber-950/40 text-amber-300">{c.userName.split(" ")[0]} {formatDay(c.date)}: {c.from} → {c.to}</Badge>
                ))}</div>
              </div>
            )}
            {(data.added?.length ?? 0) === 0 && (data.removed?.length ?? 0) === 0 && (data.modified?.length ?? 0) === 0 && (
              <p className="text-xs text-muted-foreground">Ponowna publikacja bez zmian</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, alert }: { label: string; value: number; alert?: boolean }) { return <Card size="sm" className="gap-1 p-2 text-center"><span className="text-lg font-semibold tabular-nums">{value}</span><span className={cn("text-[10px] leading-tight text-muted-foreground", alert && "text-amber-500")}>{label}</span></Card>; }
function Notice({ type, children }: { type: "success" | "error"; children: ReactNode }) { return <div className={cn("rounded-md border px-3 py-2 text-xs", type === "success" ? "border-emerald-700/50 bg-emerald-950/20 text-emerald-300" : "border-red-700/50 bg-red-950/20 text-red-300")}>{children}</div>; }
function Loading() { return <div className="flex justify-center py-10"><Loader2 className="h-7 w-7 animate-spin text-red-500" /></div>; }
function Empty({ text }: { text: string }) { return <p className="py-10 text-center text-sm text-muted-foreground">{text}</p>; }
