"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, ChevronRight, Shield, Loader2 } from "lucide-react";

interface User {
  id: number;
  name: string;
  role: string;
  isLeader: boolean;
  isActive: boolean;
  minHours: number;
  maxHours: number;
}

const ROLE_LABEL: Record<string, string> = {
  kierowca: "Kierowca",
  ratownik: "Ratownik",
  oba: "K + R",
};

export function ZespolClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function openAdd() {
    setEditingUser(null);
    setDialogOpen(true);
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setDialogOpen(true);
  }

  function handleSaved(user: User, isNew: boolean) {
    if (isNew) {
      setUsers((prev) => [...prev, user]);
    } else {
      setUsers((prev) => prev.map((u) => (u.id === user.id ? user : u)));
    }
    setDialogOpen(false);
  }

  return (
    <>
      <PageHeader title="Zespół" description="Zarządzanie członkami G01042" />
      <div className="p-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {users.map((user) => (
              <Card
                key={user.id}
                className={!user.isActive ? "opacity-50" : ""}
              >
                <CardContent
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => openEdit(user)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{user.name}</span>
                      {user.isLeader && (
                        <Shield className="h-3.5 w-3.5 text-red-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {ROLE_LABEL[user.role] ?? user.role}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {user.minHours}–{user.maxHours}h
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                </CardContent>
              </Card>
            ))}
            <Button
              onClick={openAdd}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Dodaj pracownika
            </Button>
          </>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? editingUser.name : "Nowy pracownik"}
            </DialogTitle>
          </DialogHeader>
          <UserForm
            user={editingUser}
            onSaved={handleSaved}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function UserForm({
  user,
  onSaved,
  onCancel,
}: {
  user: User | null;
  onSaved: (user: User, isNew: boolean) => void;
  onCancel: () => void;
}) {
  const isNew = !user;
  const [name, setName] = useState(user?.name ?? "");
  const [role, setRole] = useState(user?.role ?? "ratownik");
  const [minHours, setMinHours] = useState(String(user?.minHours ?? 120));
  const [maxHours, setMaxHours] = useState(String(user?.maxHours ?? 240));
  const [pin, setPin] = useState("");
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave() {
    setSaving(true);
    setMessage("");

    if (isNew) {
      if (!name.trim()) {
        setMessage("Podaj imię i nazwisko");
        setSaving(false);
        return;
      }
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          role,
          pin: pin || "1234",
          minHours: Number(minHours),
          maxHours: Number(maxHours),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onSaved(data.user, true);
      } else {
        setMessage("Błąd przy tworzeniu pracownika");
      }
    } else {
      const patches: Promise<Response>[] = [];

      if (role !== user.role) {
        patches.push(
          fetch("/api/admin/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id, action: "setRole", role }),
          })
        );
      }

      if (
        Number(minHours) !== user.minHours ||
        Number(maxHours) !== user.maxHours
      ) {
        patches.push(
          fetch("/api/admin/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              action: "setLimits",
              minHours: Number(minHours),
              maxHours: Number(maxHours),
            }),
          })
        );
      }

      if (isActive !== user.isActive) {
        patches.push(
          fetch("/api/admin/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              action: "toggleActive",
              isActive,
            }),
          })
        );
      }

      if (pin.length >= 4) {
        patches.push(
          fetch("/api/admin/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              action: "setPin",
              pin,
            }),
          })
        );
      }

      await Promise.all(patches);
      onSaved(
        {
          ...user,
          role,
          minHours: Number(minHours),
          maxHours: Number(maxHours),
          isActive,
        },
        false
      );
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      {isNew && (
        <div className="space-y-1.5">
          <Label>Imię i nazwisko</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nazwisko Imię"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Funkcja</Label>
        <Select value={role} onValueChange={(v) => v && setRole(v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="kierowca">Kierowca</SelectItem>
            <SelectItem value="ratownik">Ratownik</SelectItem>
            <SelectItem value="oba">Kierowca + Ratownik</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Min. godzin</Label>
          <Input
            type="number"
            value={minHours}
            onChange={(e) => setMinHours(e.target.value)}
            min={0}
            step={12}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Max. godzin</Label>
          <Input
            type="number"
            value={maxHours}
            onChange={(e) => setMaxHours(e.target.value)}
            min={0}
            step={12}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>{isNew ? "PIN" : "Nowy PIN (zostaw puste aby nie zmieniać)"}</Label>
        <Input
          value={pin}
          onChange={(e) =>
            setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          placeholder={isNew ? "1234" : "••••"}
          maxLength={6}
          inputMode="numeric"
        />
      </div>

      {!isNew && (
        <div className="flex items-center justify-between">
          <Label>Aktywny</Label>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>
      )}

      {message && (
        <p className="text-sm text-red-500">{message}</p>
      )}

      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onCancel}>
          Anuluj
        </Button>
        <Button
          className="flex-1"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {isNew ? "Dodaj" : "Zapisz"}
        </Button>
      </div>
    </div>
  );
}
