"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, CalendarDays, ClipboardCheck, Package, AlertTriangle } from "lucide-react";
import Link from "next/link";

export function AdminClient() {
  return (
    <>
      <PageHeader title="Panel lidera" description="Zarządzanie zespołem G01042" />
      <div className="p-4 space-y-4">
        <div className="grid gap-3">
          <Link href="/admin/zespol">
            <Card className="transition-colors hover:bg-accent/50">
              <CardHeader className="flex flex-row items-center gap-4 p-4">
                <Users className="h-8 w-8 text-blue-400" />
                <div>
                  <CardTitle className="text-base">Zespół</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Zarządzaj członkami, resetuj PIN-y
                  </p>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/grafik">
            <Card className="transition-colors hover:bg-accent/50">
              <CardHeader className="flex flex-row items-center gap-4 p-4">
                <CalendarDays className="h-8 w-8 text-green-400" />
                <div>
                  <CardTitle className="text-base">Tworzenie grafiku</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Przeglądaj propozycje, twórz grafik
                  </p>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/checklisty">
            <Card className="transition-colors hover:bg-accent/50">
              <CardHeader className="flex flex-row items-center gap-4 p-4">
                <ClipboardCheck className="h-8 w-8 text-yellow-400" />
                <div>
                  <CardTitle className="text-base">Przegląd checklist</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Status wypełnienia checklist dziennych
                  </p>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/zamowienia">
            <Card className="transition-colors hover:bg-accent/50">
              <CardHeader className="flex flex-row items-center gap-4 p-4">
                <Package className="h-8 w-8 text-purple-400" />
                <div>
                  <CardTitle className="text-base">Zamówienia</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Generuj zamówienia na podstawie zużycia
                  </p>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/meldunki">
            <Card className="transition-colors hover:bg-accent/50">
              <CardHeader className="flex flex-row items-center gap-4 p-4">
                <AlertTriangle className="h-8 w-8 text-red-400" />
                <div>
                  <CardTitle className="text-base">Meldunki</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Wszystkie zgłoszenia zdarzeń
                  </p>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </>
  );
}
