"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, PackageCheck, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface OrderItem { materialId: number; materialName: string; unit: string; minStock: number; quantityUsed: number; quantityOrdered: number; }

export function ZamowieniaAdminClient() {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(`${today.slice(0, 8)}01`);
  const [to, setTo] = useState(today);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!from || !to || from > to) return;
    let active = true;
    fetch(`/api/admin/orders?from=${from}&to=${to}`)
      .then((response) => response.json())
      .then((data) => {
        if (active) setItems((data.items ?? []).map((item: Omit<OrderItem, "quantityOrdered">) => ({ ...item, quantityOrdered: Math.max(item.quantityUsed, item.minStock) })));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [from, to, refreshKey]);

  function updateQuantity(materialId: number, value: string) {
    setItems((current) => current.map((item) => item.materialId === materialId ? { ...item, quantityOrdered: Math.max(0, Number(value)) } : item));
  }

  async function createOrder() {
    setSaving(true);
    const response = await fetch("/api/admin/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ periodStart: from, periodEnd: to, notes, items }),
    });
    if (response.ok) setCreated(true);
    setSaving(false);
  }

  return (
    <>
      <PageHeader title="Zamówienia" description="Generator na podstawie zarejestrowanego zużycia" />
      <div className="space-y-4 p-4">
        <Card><CardContent className="grid grid-cols-2 gap-3 p-3"><div><Label className="text-xs">Od</Label><Input type="date" value={from} onChange={(event) => { setLoading(true); setCreated(false); setFrom(event.target.value); }} /></div><div><Label className="text-xs">Do</Label><Input type="date" value={to} onChange={(event) => { setLoading(true); setCreated(false); setTo(event.target.value); }} /></div><Button variant="outline" className="col-span-2" onClick={() => { setLoading(true); setCreated(false); setRefreshKey((key) => key + 1); }}><RefreshCw className="mr-2 h-4 w-4" />Przelicz zużycie</Button></CardContent></Card>
        {created && <div className="flex items-center gap-2 rounded-md border border-emerald-800 bg-emerald-950/20 p-3 text-sm text-emerald-400"><CheckCircle2 className="h-5 w-5" />Zamówienie zostało zapisane.</div>}
        {loading ? <div className="flex justify-center py-10"><div className="h-7 w-7 animate-spin rounded-full border-2 border-red-500 border-t-transparent" /></div> : items.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Brak zarejestrowanego zużycia w tym okresie</p> : (
          <div className="space-y-2">
            {items.map((item) => <Card key={item.materialId}><CardContent className="grid grid-cols-[1fr_88px] items-end gap-3 p-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{item.materialName}</p><p className="text-xs text-muted-foreground">Zużyto: {item.quantityUsed} {item.unit}</p></div><div><Label className="text-xs">Zamów</Label><Input type="number" min="0" value={item.quantityOrdered} onChange={(event) => updateQuantity(item.materialId, event.target.value)} /></div></CardContent></Card>)}
            <div><Label className="text-xs">Uwagi do zamówienia</Label><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Opcjonalne informacje dla osoby realizującej zamówienie" /></div>
            <Button className="w-full bg-red-600 hover:bg-red-700" disabled={saving || items.every((item) => item.quantityOrdered === 0)} onClick={createOrder}><PackageCheck className="mr-2 h-4 w-4" />{saving ? "Zapisywanie..." : "Utwórz zamówienie"}</Button>
          </div>
        )}
      </div>
    </>
  );
}
