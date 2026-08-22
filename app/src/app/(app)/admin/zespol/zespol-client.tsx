"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, KeyRound, Shield } from "lucide-react";

interface User {
  id: number;
  name: string;
  role: string;
  isLeader: boolean;
  isActive: boolean;
}

const ROLE_LABEL: Record<string, string> = {
  kierowca: "Kierowca",
  ratownik: "Ratownik",
  oba: "K + R",
};

export function ZespolClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // New user form
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("ratownik");
  const [newPin, setNewPin] = useState("1234");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function addUser() {
    if (!newName) return;
    setAdding(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, role: newRole, pin: newPin }),
    });
    if (res.ok) {
      const data = await res.json();
      setUsers([...users, data.user]);
      setNewName("");
      setNewPin("1234");
    }
    setAdding(false);
  }

  async function setPin(userId: number, pin: string) {
    if (!/^\d{4,6}$/.test(pin)) {
      alert("PIN musi mieć 4-6 cyfr");
      return;
    }
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "setPin", pin }),
    });
    if (res.ok) {
      alert("PIN ustawiony");
    }
  }

  async function changeRole(userId: number, role: string) {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "setRole", role }),
    });
    if (res.ok) {
      setUsers(users.map((u) => (u.id === userId ? { ...u, role } : u)));
    }
  }

  async function toggleActive(userId: number, isActive: boolean) {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "toggleActive", isActive }),
    });
    setUsers(
      users.map((u) => (u.id === userId ? { ...u, isActive } : u))
    );
  }

  return (
    <>
      <PageHeader title="Zespół" description="Zarządzanie członkami G01042" />
      <div className="p-4 space-y-4">
        {/* Add new member */}
        <Card className="p-3">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Plus className="h-4 w-4" /> Dodaj członka
          </h3>
          <div className="space-y-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nazwisko Imię"
              className="h-9"
            />
            <div className="flex gap-2">
              <Select value={newRole} onValueChange={(v) => setNewRole(v ?? "ratownik")}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kierowca">Kierowca</SelectItem>
                  <SelectItem value="ratownik">Ratownik</SelectItem>
                  <SelectItem value="oba">Kierowca + Ratownik</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="PIN"
                className="h-9 w-24"
                maxLength={6}
              />
            </div>
            <Button
              onClick={addUser}
              disabled={!newName || adding}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {adding ? "Dodawanie..." : "Dodaj"}
            </Button>
          </div>
        </Card>

        {/* Team list */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <Card
                key={user.id}
                className={!user.isActive ? "opacity-50" : ""}
              >
                <CardContent className="flex items-center justify-between p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{user.name}</span>
                      {user.isLeader && (
                        <Shield className="h-3.5 w-3.5 text-red-400" />
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {ROLE_LABEL[user.role] ?? user.role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={user.role} onValueChange={(v) => v && changeRole(user.id, v)}>
                      <SelectTrigger className="h-8 w-24 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kierowca">Kierowca</SelectItem>
                        <SelectItem value="ratownik">Ratownik</SelectItem>
                        <SelectItem value="oba">K + R</SelectItem>
                      </SelectContent>
                    </Select>
                    <Dialog>
                      <DialogTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" title="Ustaw PIN" />}>
                        <KeyRound className="h-4 w-4" />
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Ustaw PIN — {user.name}</DialogTitle>
                        </DialogHeader>
                        <PinForm userId={user.id} onSave={setPin} />
                      </DialogContent>
                    </Dialog>
                    <Switch
                      checked={user.isActive}
                      onCheckedChange={(v) => toggleActive(user.id, v)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function PinForm({ userId, onSave }: { userId: number; onSave: (userId: number, pin: string) => void }) {
  const [pin, setLocalPin] = useState("");
  return (
    <div className="space-y-3">
      <Input
        value={pin}
        onChange={(e) => setLocalPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="Nowy PIN (4-6 cyfr)"
        maxLength={6}
        inputMode="numeric"
      />
      <Button
        onClick={() => { onSave(userId, pin); setLocalPin(""); }}
        disabled={pin.length < 4}
        className="w-full"
      >
        Zapisz PIN
      </Button>
    </div>
  );
}
