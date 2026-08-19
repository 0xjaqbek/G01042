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

  async function resetPin(userId: number) {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "resetPin", pin: "1234" }),
    });
    alert("PIN zresetowany do 1234");
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
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{user.name}</span>
                      {user.isLeader && (
                        <Shield className="h-3.5 w-3.5 text-red-400" />
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {user.role === "kierowca" ? "Kierowca" : "Ratownik"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => resetPin(user.id)}
                      title="Reset PIN"
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
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
