"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle } from "lucide-react";
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

export function ChecklistaClient({ userId }: { userId: string }) {
  const [categories, setCategories] = useState<ChecklistCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetch(`/api/checklist?userId=${userId}&date=${today}`)
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

  function updateQuantity(categoryId: number, itemId: number, quantity: string) {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              items: cat.items.map((item) =>
                item.id === itemId
                  ? { ...item, quantity: quantity ? parseInt(quantity) : null }
                  : item
              ),
            }
          : cat
      )
    );
  }

  function updateNotes(categoryId: number, itemId: number, notes: string) {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              items: cat.items.map((item) =>
                item.id === itemId ? { ...item, notes } : item
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
        description={today}
      />
      <div className="p-4 space-y-4">
        {/* Progress bar */}
        <Card className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Postęp</span>
            <Badge
              variant={progress === 100 ? "default" : "secondary"}
              className={cn(progress === 100 && "bg-green-600")}
            >
              {checkedItems}/{totalItems} ({progress}%)
            </Badge>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                progress === 100 ? "bg-green-500" : "bg-red-500"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </Card>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
          </div>
        ) : categories.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            Brak elementów checklisty. Lider musi dodać elementy.
          </Card>
        ) : (
          categories.map((category) => (
            <Card key={category.id}>
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  {category.name}
                  <Badge variant="secondary" className="text-xs">
                    {category.items.filter((i) => i.checked).length}/
                    {category.items.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-2">
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-lg border p-3 transition-colors",
                      item.checked
                        ? "border-green-800/50 bg-green-950/20"
                        : "border-border"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={item.checked}
                        onCheckedChange={() =>
                          toggleItem(category.id, item.id)
                        }
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            item.checked && "line-through text-muted-foreground"
                          )}
                        >
                          {item.name}
                        </span>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.description}
                          </p>
                        )}
                        {item.expectedQuantity && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">
                              Ilość (wymagane: {item.expectedQuantity}):
                            </span>
                            <Input
                              type="number"
                              className="h-7 w-20 text-xs"
                              value={item.quantity ?? ""}
                              onChange={(e) =>
                                updateQuantity(
                                  category.id,
                                  item.id,
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}

        {categories.length > 0 && (
          <Button
            className="w-full bg-red-600 hover:bg-red-700"
            onClick={saveChecklist}
            disabled={saving}
          >
            {saving ? "Zapisywanie..." : "Zapisz checklistę"}
          </Button>
        )}
      </div>
    </>
  );
}
