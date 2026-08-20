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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Eye, EyeOff, Loader2, Megaphone, Plus, Trash2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface Announcement {
  id: number;
  title: string;
  body: string | null;
  priority: "normal" | "urgent";
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  authorName: string;
  ackCount: number;
}

export function OgloszeniaAdminClient() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", priority: "normal" as "normal" | "urgent", expiresAt: "" });

  useEffect(() => {
    fetch("/api/admin/announcements")
      .then((r) => r.json())
      .then((data) => {
        setAnnouncements(data.announcements ?? []);
        setTotalUsers(data.totalUsers ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function createAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        body: form.body || null,
        priority: form.priority,
        expiresAt: form.expiresAt || null,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setAnnouncements((prev) => [
        { ...data.announcement, authorName: "Ty", ackCount: 0 },
        ...prev,
      ]);
      setForm({ title: "", body: "", priority: "normal", expiresAt: "" });
      setDialogOpen(false);
    }
    setSaving(false);
  }

  async function toggleActive(id: number, isActive: boolean) {
    const res = await fetch("/api/admin/announcements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    if (res.ok) {
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isActive: !isActive } : a))
      );
    }
  }

  async function deleteAnnouncement(id: number) {
    const res = await fetch(`/api/admin/announcements?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    }
  }

  return (
    <>
      <PageHeader title="Ogłoszenia" description="Tablica informacyjna zespołu" />
      <div className="p-4 space-y-3">
        <Button
          className="h-11 w-full bg-primary font-semibold hover:bg-primary/90"
          onClick={() => {
            setForm({ title: "", body: "", priority: "normal", expiresAt: "" });
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nowe ogłoszenie
        </Button>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : announcements.length === 0 ? (
          <Card className="border-transparent p-8 text-center text-sm text-muted-foreground">
            Brak ogłoszeń
          </Card>
        ) : (
          announcements.map((a) => {
            const isExpired = a.expiresAt && new Date(a.expiresAt) < new Date();
            return (
              <Card
                key={a.id}
                className={cn(
                  "border-transparent",
                  !a.isActive && "opacity-50",
                  isExpired && "opacity-40"
                )}
              >
                <CardHeader className="flex-row items-start gap-3 px-4 pb-2 pt-4">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      a.priority === "urgent" ? "bg-red-500/15" : "bg-blue-500/15"
                    )}
                  >
                    {a.priority === "urgent" ? (
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                    ) : (
                      <Megaphone className="h-4 w-4 text-blue-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm">{a.title}</CardTitle>
                      {a.priority === "urgent" && (
                        <Badge className="bg-red-600 text-[10px]">Pilne</Badge>
                      )}
                    </div>
                    {a.body && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {a.body}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>{a.authorName}</span>
                      <span>{new Date(a.createdAt).toLocaleDateString("pl")}</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {a.ackCount}/{totalUsers}
                      </span>
                      {isExpired && <Badge variant="secondary" className="text-[10px]">Wygasło</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex gap-2 px-4 pb-3 pt-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => toggleActive(a.id, a.isActive)}
                  >
                    {a.isActive ? (
                      <><EyeOff className="mr-1 h-3 w-3" />Ukryj</>
                    ) : (
                      <><Eye className="mr-1 h-3 w-3" />Pokaż</>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-red-400 hover:text-red-300"
                    onClick={() => deleteAnnouncement(a.id)}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Usuń
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={createAnnouncement} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Nowe ogłoszenie</DialogTitle>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="ann-title">Tytuł</Label>
              <Input
                id="ann-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="np. Zmiana w grafiku"
                maxLength={200}
                className="h-11"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ann-body">Treść (opcjonalnie)</Label>
              <Textarea
                id="ann-body"
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Szczegóły ogłoszenia..."
                className="min-h-[80px] text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Priorytet</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm((f) => ({ ...f, priority: (v ?? "normal") as "normal" | "urgent" }))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Zwykłe</SelectItem>
                    <SelectItem value="urgent">Pilne</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ann-expires">Wygasa (opcjonalnie)</Label>
                <Input
                  id="ann-expires"
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                  className="h-11"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Anuluj
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Dodaj
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
