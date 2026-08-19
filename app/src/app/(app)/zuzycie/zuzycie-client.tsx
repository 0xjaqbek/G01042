"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Package, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Material {
  id: number;
  name: string;
  unit: string;
}

interface UsageEntry {
  id?: number;
  materialId: number;
  materialName: string;
  quantity: number;
  notes: string;
}

export function ZuzycieClient({
  userId,
  isLeader,
}: {
  userId: string;
  isLeader: boolean;
}) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [entries, setEntries] = useState<UsageEntry[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    Promise.all([
      fetch("/api/materials").then((r) => r.json()),
      fetch(`/api/material-usage?userId=${userId}&date=${today}`).then((r) =>
        r.json()
      ),
    ])
      .then(([materialsData, usageData]) => {
        setMaterials(materialsData.materials || []);
        setEntries(usageData.entries || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId, today]);

  async function addEntry() {
    if (!selectedMaterial || !quantity) return;
    setSaving(true);

    const material = materials.find((m) => m.id === parseInt(selectedMaterial));
    if (!material) return;

    const entry: UsageEntry = {
      materialId: material.id,
      materialName: material.name,
      quantity: parseInt(quantity),
      notes,
    };

    const res = await fetch("/api/material-usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        date: today,
        materialId: material.id,
        quantity: parseInt(quantity),
        notes,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setEntries([...entries, { ...entry, id: data.id }]);
      setSelectedMaterial("");
      setQuantity("");
      setNotes("");
    }
    setSaving(false);
  }

  return (
    <>
      <PageHeader
        title="Zużycie materiałów"
        description={today}
      />
      <div className="p-4 space-y-4">
        {/* Add new entry */}
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Dodaj zużycie
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-3">
            <div>
              <Label className="text-xs">Materiał</Label>
              <Select
                value={selectedMaterial}
                onValueChange={(v) => setSelectedMaterial(v ?? "")}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Wybierz materiał..." />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.name} ({m.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Ilość</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Ilość"
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs">Uwagi (opcjonalnie)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="np. interwencja przy pacjencie..."
                className="min-h-[60px] text-sm"
              />
            </div>
            <Button
              onClick={addEntry}
              disabled={!selectedMaterial || !quantity || saving}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {saving ? "Dodawanie..." : "Dodaj"}
            </Button>
          </CardContent>
        </Card>

        {/* Today's entries */}
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="h-4 w-4" />
              Dzisiejsze zużycie
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
              </div>
            ) : entries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Brak wpisów na dziś
              </p>
            ) : (
              <div className="space-y-2">
                {entries.map((entry, i) => (
                  <div
                    key={entry.id || i}
                    className="flex items-center justify-between rounded-lg border p-2"
                  >
                    <div>
                      <span className="text-sm font-medium">
                        {entry.materialName}
                      </span>
                      {entry.notes && (
                        <p className="text-xs text-muted-foreground">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">{entry.quantity}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generate order button (leader only) */}
        {isLeader && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => (window.location.href = "/admin/zamowienia")}
          >
            <FileText className="h-4 w-4 mr-2" />
            Generuj zamówienie
          </Button>
        )}
      </div>
    </>
  );
}
