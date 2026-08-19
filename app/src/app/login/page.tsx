"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      name,
      pin,
      redirect: false,
    });

    if (result?.error) {
      setError("Nieprawidłowe dane logowania");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-4">
      <Card className="w-full max-w-sm border-border/50">
        <CardHeader className="items-center pb-2 pt-8 text-center">
          {/* SVG ambulance cross logo */}
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-8 w-8 text-primary-foreground"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 2h2v8h8v2h-8v8h-2v-8H3v-2h8z" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            G01042
          </CardTitle>
          <CardDescription className="text-sm">
            Zespół ratownictwa medycznego Przywidz
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Imię i nazwisko</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. Reszczyński Łukasz"
                autoComplete="name"
                className="h-11"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Wpisz PIN"
                autoComplete="current-password"
                className="h-11"
                required
              />
            </div>
            {error && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="h-11 w-full bg-primary font-semibold hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logowanie...
                </>
              ) : (
                "Zaloguj się"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
