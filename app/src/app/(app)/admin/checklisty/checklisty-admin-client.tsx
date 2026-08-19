"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleDashed, ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface TeamStatus { id: number; name: string; role: string; completedAt: string | null; completedItems: number; }

export function ChecklistyAdminClient() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [users, setUsers] = useState<TeamStatus[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/checklists?date=${date}`)
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;
        setUsers(data.users ?? []);
        setTotalItems(data.totalItems ?? 0);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [date]);
  const completed = users.filter((user) => Boolean(user.completedAt)).length;

  return (
    <>
      <PageHeader title="Przegląd checklist" description="Kontrola wykonania checklist dziennych" />
      <div className="space-y-4 p-4">
        <Input type="date" value={date} onChange={(event) => { setLoading(true); setDate(event.target.value); }} aria-label="Data checklist" />
        <div className="grid grid-cols-2 gap-3">
          <Card><CardContent className="p-3"><p className="text-2xl font-semibold">{completed}/{users.length}</p><p className="text-xs text-muted-foreground">zakończone</p></CardContent></Card>
          <Card><CardContent className="p-3"><p className="text-2xl font-semibold">{totalItems}</p><p className="text-xs text-muted-foreground">pozycji checklisty</p></CardContent></Card>
        </div>
        {loading ? <div className="flex justify-center py-10"><div className="h-7 w-7 animate-spin rounded-full border-2 border-red-500 border-t-transparent" /></div> : users.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Brak aktywnych członków zespołu</p> : (
          <div className="space-y-2">
            {users.map((user) => {
              const done = Boolean(user.completedAt);
              return <Card key={user.id}><CardContent className="flex items-center gap-3 p-3">{done ? <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-500" /> : <CircleDashed className="h-6 w-6 shrink-0 text-muted-foreground" />}<div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{user.name}</p><p className="text-xs text-muted-foreground">{user.completedItems}/{totalItems} pozycji</p></div><Badge variant={done ? "default" : "secondary"} className={done ? "bg-emerald-700" : ""}>{done ? "Gotowa" : "Brak"}</Badge></CardContent></Card>;
            })}
          </div>
        )}
        <div className="flex items-center gap-2 rounded-md border p-3 text-xs text-muted-foreground"><ClipboardCheck className="h-4 w-4 shrink-0" />Status „Gotowa” pojawia się po zapisaniu checklisty przez członka zespołu.</div>
      </div>
    </>
  );
}
