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
import { AlertTriangle, CheckCircle2, Plus, History } from "lucide-react";
import { cn } from "@/lib/utils";

interface Incident {
  id: number;
  date: string;
  type: string;
  description: string;
  severity: string;
  location: string;
  mileage: number | null;
  actionTaken: string;
  isResolved: boolean;
  createdAt: string;
}

const INCIDENT_TYPES = [
  { value: "uszkodzenie", label: "Uszkodzenie pojazdu" },
  { value: "awaria", label: "Awaria mechaniczna" },
  { value: "kolizja", label: "Kolizja / wypadek" },
  { value: "opona", label: "Problem z oponą" },
  { value: "elektryka", label: "Usterka elektryczna" },
  { value: "inne", label: "Inne" },
];

const SEVERITY_OPTIONS = [
  { value: "info", label: "Informacja", color: "bg-blue-600" },
  { value: "minor", label: "Drobne", color: "bg-yellow-600" },
  { value: "major", label: "Poważne", color: "bg-orange-600" },
  { value: "critical", label: "Krytyczne", color: "bg-red-600" },
];

export function MeldunekClient({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [type, setType] = useState("");
  const [severity, setSeverity] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [mileage, setMileage] = useState("");
  const [actionTaken, setActionTaken] = useState("");

  useEffect(() => {
    fetch(`/api/incidents?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        setIncidents(data.incidents || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!type || !severity || !description) return;

    setSubmitting(true);
    const res = await fetch("/api/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        date: new Date().toISOString().split("T")[0],
        type,
        severity,
        description,
        location,
        mileage: mileage ? parseInt(mileage) : null,
        actionTaken,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setIncidents([data.incident, ...incidents]);
      // Reset form
      setType("");
      setSeverity("");
      setDescription("");
      setLocation("");
      setMileage("");
      setActionTaken("");
      setShowForm(false);
    }
    setSubmitting(false);
  }

  return (
    <>
      <PageHeader
        title="Meldunek kierowcy"
        description="Zgłoszenia zdarzeń i usterek pojazdu"
      />
      <div className="p-4 space-y-4">
        {!showForm ? (
          <Button
            onClick={() => setShowForm(true)}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nowe zgłoszenie
          </Button>
        ) : (
          <Card>
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                Nowe zgłoszenie
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <Label className="text-xs">Typ zdarzenia</Label>
                  <Select value={type} onValueChange={(v) => setType(v ?? "")}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Wybierz typ..." />
                    </SelectTrigger>
                    <SelectContent>
                      {INCIDENT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Stopień ważności</Label>
                  <Select value={severity} onValueChange={(v) => setSeverity(v ?? "")}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Wybierz..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SEVERITY_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Opis zdarzenia</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Opisz co się stało..."
                    className="min-h-[80px] text-sm"
                    required
                  />
                </div>

                <div>
                  <Label className="text-xs">Lokalizacja</Label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="np. Przywidz, droga nr 224"
                    className="h-9"
                  />
                </div>

                <div>
                  <Label className="text-xs">Przebieg (km)</Label>
                  <Input
                    type="number"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    placeholder="Stan licznika"
                    className="h-9"
                  />
                </div>

                <div>
                  <Label className="text-xs">Podjęte działania</Label>
                  <Textarea
                    value={actionTaken}
                    onChange={(e) => setActionTaken(e.target.value)}
                    placeholder="Co zostało zrobione..."
                    className="min-h-[60px] text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setShowForm(false)}
                  >
                    Anuluj
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    disabled={submitting || !type || !severity || !description}
                  >
                    {submitting ? "Wysyłanie..." : "Wyślij"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* History */}
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="h-4 w-4" />
              Historia zgłoszeń
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
              </div>
            ) : incidents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Brak zgłoszeń
              </p>
            ) : (
              <div className="space-y-2">
                {incidents.map((incident) => {
                  const severityOpt = SEVERITY_OPTIONS.find(
                    (s) => s.value === incident.severity
                  );
                  return (
                    <div
                      key={incident.id}
                      className={cn(
                        "rounded-lg border p-3",
                        incident.isResolved
                          ? "border-green-800/50 bg-green-950/10"
                          : "border-border"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              className={cn(
                                "text-xs text-white",
                                severityOpt?.color || "bg-gray-600"
                              )}
                            >
                              {severityOpt?.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {incident.date}
                            </span>
                          </div>
                          <p className="text-sm font-medium">
                            {INCIDENT_TYPES.find((t) => t.value === incident.type)?.label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {incident.description}
                          </p>
                          {incident.location && (
                            <p className="text-xs text-muted-foreground mt-1">
                              📍 {incident.location}
                            </p>
                          )}
                        </div>
                        {incident.isResolved && (
                          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
