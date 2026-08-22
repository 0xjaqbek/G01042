"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistCategory {
  id: number;
  name: string;
  items: ChecklistItem[];
}

interface ChecklistItem {
  id: number;
  name: string;
  description: string | null;
  expectedQuantity: number | null;
  checked: boolean;
  quantity: number | null;
  notes: string;
}

export function ChecklistaClient({ userId, shiftFunction }: { userId: string; shiftFunction: string | null }) {
  const [categories, setCategories] = useState<ChecklistCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const params = new URLSearchParams({ userId, date: today });
    if (shiftFunction) params.set("fn", shiftFunction);
    fetch(`/api/checklist?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setCategories(data.categories || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId, today]);

  function toggleItem(categoryId: number, itemId: number) {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              items: cat.items.map((item) =>
                item.id === itemId
                  ? { ...item, checked: !item.checked }
                  : item
              ),
            }
          : cat
      )
    );
  }

  async function saveChecklist() {
    setSaving(true);
    const allItems = categories.flatMap((cat) =>
      cat.items.map((item) => ({
        itemId: item.id,
        checked: item.checked,
        quantity: item.quantity,
        notes: item.notes,
      }))
    );

    await fetch("/api/checklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        date: today,
        items: allItems,
      }),
    });
    setSaving(false);
  }

  const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);
  const checkedItems = categories.reduce(
    (sum, cat) => sum + cat.items.filter((i) => i.checked).length,
    0
  );
  const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  return (
    <>
      <PageHeader
        title="Checklista dzienna"
        description={`${today} — ${shiftFunction === "K" ? "Kierowca" : shiftFunction === "R" ? "Ratownik" : "Brak dyżuru"}`}
      />
      <div className="p-4 space-y-3">
        {/* Progress bar */}
        <Card className="border-transparent p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Postęp</span>
            <Badge
              variant={progress === 100 ? "default" : "secondary"}
              className={cn(progress === 100 && "bg-emerald-600")}
            >
              {checkedItems}/{totalItems} ({progress}%)
            </Badge>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                progress === 100 ? "bg-emerald-500" : "bg-primary"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </Card>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : categories.length === 0 ? (
          <Card className="border-transparent p-8 text-center text-sm text-muted-foreground">
            Brak elementów checklisty. Lider musi dodać elementy.
          </Card>
        ) : (
          categories.map((category) => (
            <Card key={category.id} className="border-transparent">
              <CardHeader className="px-4 pb-2 pt-4">
                <CardTitle className="flex items-center justify-between text-sm">
                  {category.name}
                  <Badge variant="secondary" className="text-[11px]">
                    {category.items.filter((i) => i.checked).length}/
                    {category.items.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 space-y-2">
                {category.items.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => toggleItem(category.id, item.id)}
                    className={cn(
                      "w-full rounded-lg border p-3 text-left transition-colors",
                      item.checked
                        ? "border-emerald-800/50 bg-emerald-950/20"
                        : "border-border/50 active:bg-accent/60"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={item.checked}
                        className="mt-0.5 pointer-events-none"
                        tabIndex={-1}
                      />
                      <div className="flex-1 min-w-0">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            item.checked && "line-through text-muted-foreground"
                          )}
                        >
                          {item.name}
                        </span>
                        {item.expectedQuantity != null && item.expectedQuantity > 0 && (
                          <span className="ml-2 text-[11px] text-muted-foreground">
                            ({item.expectedQuantity})
                          </span>
                        )}
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          ))
        )}

        {categories.length > 0 && (
          <Button
            className="h-11 w-full bg-primary font-semibold hover:bg-primary/90"
            onClick={saveChecklist}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Zapisywanie...
              </>
            ) : (
              "Zapisz checklistę"
            )}
          </Button>
        )}
      </div>
    </>
  );
}
