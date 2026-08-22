"use client";

import { useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Info, Loader2 } from "lucide-react";

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
    <div className="flex min-h-dvh flex-col items-center justify-center p-4 gap-4">
      <div className="flex flex-col items-center gap-2">
        <Image
          src="/icons/login-logo.png"
          alt="G01042 Przywidz"
          width={72}
          height={72}
          priority
        />
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Zespół ratownictwa medycznego</p>
          <p className="text-sm font-semibold">Przywidz G01042</p>
        </div>
      </div>
      <Card className="w-full max-w-sm border-border/50 h-fit">
        <CardContent className="pt-6 pb-6">
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
      <footer className="flex w-full max-w-sm flex-col items-center gap-2 text-center text-xs text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">v0.2</span>
          <span className="mx-2 text-border">|</span>
          by Jaqbek
        </p>
        <Dialog>
          <DialogTrigger render={<Button variant="ghost" size="sm" />}>
            <Info className="h-4 w-4" />
            Info
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Informacje o aplikacji</DialogTitle>
              <DialogDescription>
                G01042 to narzędzie wspierające codzienną pracę zespołu ratownictwa
                medycznego w Przywidzu.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <section className="space-y-2">
                <h3 className="font-medium">Aplikacja</h3>
                <p className="text-muted-foreground">
                  Panel umożliwia szybki dostęp do grafiku, checklist,
                  zgłoszeń, propozycji oraz modułów administracyjnych zespołu.
                </p>
              </section>
              <section className="space-y-2">
                <h3 className="font-medium">Changelog</h3>
                <div className="rounded-lg border bg-muted/40 p-3">
                  <p className="font-medium">v0.1</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                    <li>Pierwsza wersja ekranu logowania i panelu G01042.</li>
                    <li>Dodane moduły pracy zespołu oraz widoki administracyjne.</li>
                    <li>Dodana stopka z informacjami o wersji aplikacji.</li>
                  </ul>
                </div>
              </section>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Zamknij
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </footer>
    </div>
  );
}
