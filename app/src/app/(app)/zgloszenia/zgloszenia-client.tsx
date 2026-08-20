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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Ambulance, CheckCircle2, History, Loader2, MapPin, MessageSquare, Plus, ShieldAlert, Truck } from "lucide-react";
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

const INCIDENT_CATEGORIES = [
  {
    label: "Pojazd",
    icon: Truck,
    types: [
      { value: "uszkodzenie", label: "Uszkodzenie pojazdu" },
      { value: "awaria", label: "Awaria mechaniczna" },
      { value: "kolizja", label: "Kolizja / wypadek drogowy" },
      { value: "opona", label: "Problem z oponą" },
      { value: "elektryka", label: "Usterka elektryczna" },
    ],
  },
  {
    label: "Medyczne",
    icon: Ambulance,
    types: [
      { value: "zdarzenie-niepozadane", label: "Zdarzenie niepożądane" },
      { value: "sprzet-medyczny", label: "Awaria sprzętu medycznego" },
      { value: "lek", label: "Problem z lekiem" },
      { value: "ekspozycja", label: "Ekspozycja zawodowa" },
    ],
  },
  {
    label: "Incydent",
    icon: ShieldAlert,
    types: [
      { value: "incydent-pacjent", label: "Incydent z pacjentem" },
      { value: "incydent-zespol", label: "Incydent w zespole" },
      { value: "agresja", label: "Agresja wobec załogi" },
    ],
  },
  {
    label: "Inne",
    icon: MessageSquare,
    types: [
      { value: "wiadomosc", label: "Wiadomość do lidera" },
      { value: "uwaga", label: "Uwaga / sugestia" },
      { value: "inne", label: "Inne" },
    ],
  },
];

const ALL_TYPES = INCIDENT_CATEGORIES.flatMap((c) => c.types);

const SEVERITY_OPTIONS = [
  { value: "info", label: "Informacja", color: "bg-blue-600" },
  { value: "minor", label: "Drobne", color: "bg-yellow-600" },
  { value: "major", label: "Poważne", color: "bg-orange-600" },
  { value: "critical", label: "Krytyczne", color: "bg-red-600" },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Pojazd": "text-amber-400",
  "Medyczne": "text-sky-400",
  "Incydent": "text-red-400",
  "Inne": "text-muted-foreground",
};

function getCategoryForType(type: string) {
  for (const cat of INCIDENT_CATEGORIES) {
    if (cat.types.some((t) => t.value === type)) return cat.label;
  }
  return "Inne";
}

export function ZgloszeniaClient({
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

  const [type, setType] = useState("");
  const [severity, setSeverity] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [mileage, setMileage] = useState("");
  const [actionTaken, setActionTaken] = useState("");

  const isVehicleType = INCIDENT_CATEGORIES[0].types.some((t) => t.value === type);

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
        title="Zgłoszenia"
        description="Zdarzenia, incydenty i wiadomości"
      />
      <div className="p-4 space-y-3">
        {!showForm ? (
          <Button
            onClick={() => setShowForm(true)}
            className="h-11 w-full bg-primary font-semibold hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nowe zgłoszenie
          </Button>
        ) : (
          <Card className="border-transparent">
            <CardHeader className="flex-row items-center gap-2 px-4 pb-2 pt-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15">
                <AlertTriangle className="h-4 w-4 text-red-400" />
              </div>
              <CardTitle className="text-sm">Nowe zgłoszenie</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Kategoria / typ</Label>
                  <Select value={type} onValueChange={(v) => setType(v ?? "")}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Wybierz typ zgłoszenia..." />
                    </SelectTrigger>
                    <SelectContent>
                      {INCIDENT_CATEGORIES.map((cat) => (
                        <SelectGroup key={cat.label}>
                          <SelectLabel className="text-xs font-semibold">{cat.label}</SelectLabel>
                          {cat.types.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Priorytet</Label>
                  <Select value={severity} onValueChange={(v) => setSeverity(v ?? "")}>
                    <SelectTrigger className="h-11">
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

                <div className="space-y-1.5">
                  <Label className="text-xs">Opis</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Opisz sytuację..."
                    className="min-h-[80px] text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Lokalizacja</Label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="np. Przywidz, droga nr 224"
                    className="h-11"
                  />
                </div>

                {isVehicleType && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Przebieg (km)</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={mileage}
                      onChange={(e) => setMileage(e.target.value)}
                      placeholder="Stan licznika"
                      className="h-11"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs">Podjęte działania</Label>
                  <Textarea
                    value={actionTaken}
                    onChange={(e) => setActionTaken(e.target.value)}
                    placeholder="Co zostało zrobione..."
                    className="min-h-[60px] text-sm"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-11 flex-1"
                    onClick={() => setShowForm(false)}
                  >
                    Anuluj
                  </Button>
                  <Button
                    type="submit"
                    className="h-11 flex-1 bg-primary font-semibold hover:bg-primary/90"
                    disabled={submitting || !type || !severity || !description}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Wysyłanie...
                      </>
                    ) : (
                      "Wyślij"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* History */}
        <Card className="border-transparent">
          <CardHeader className="flex-row items-center gap-2 px-4 pb-2 pt-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15">
              <History className="h-4 w-4 text-blue-400" />
            </div>
            <CardTitle className="text-sm">Historia zgłoszeń</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : incidents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Brak zgłoszeń
              </p>
            ) : (
              <div className="space-y-2">
                {incidents.map((incident) => {
                  const severityOpt = SEVERITY_OPTIONS.find(
                    (s) => s.value === incident.severity
                  );
                  const category = getCategoryForType(incident.type);
                  const typeLabel = ALL_TYPES.find((t) => t.value === incident.type)?.label || incident.type;
                  return (
                    <div
                      key={incident.id}
                      className={cn(
                        "rounded-lg border p-3",
                        incident.isResolved
                          ? "border-emerald-800/50 bg-emerald-950/10"
                          : "border-border/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge
                              className={cn(
                                "text-[10px] text-white",
                                severityOpt?.color || "bg-gray-600"
                              )}
                            >
                              {severityOpt?.label}
                            </Badge>
                            <span className={cn("text-[10px] font-medium", CATEGORY_COLORS[category])}>
                              {category}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {incident.date}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{typeLabel}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {incident.description}
                          </p>
                          {incident.location && (
                            <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {incident.location}
                            </p>
                          )}
                        </div>
                        {incident.isResolved && (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
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
