"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

export function ServiceWorkerRegistration() {
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    let refreshing = false;

    // Reload once when a new SW takes control
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((reg) => {
        // New SW waiting right away (e.g. user reopened app)
        if (reg.waiting) {
          setUpdateReady(true);
        }

        // New SW installed while page is open
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setUpdateReady(true);
            }
          });
        });

        // Check for updates every 60 seconds
        const interval = setInterval(() => {
          reg.update().catch(() => {});
        }, 60_000);

        return () => clearInterval(interval);
      })
      .catch((error) => {
        console.error("Service worker registration failed", error);
      });
  }, []);

  function applyUpdate() {
    navigator.serviceWorker.getRegistration().then((reg) => {
      reg?.waiting?.postMessage({ type: "SKIP_WAITING" });
    });
  }

  if (!updateReady) return null;

  return (
    <button
      onClick={applyUpdate}
      className="fixed top-2 left-1/2 z-[100] -translate-x-1/2 flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg animate-in fade-in slide-in-from-top-2"
    >
      <RefreshCw className="h-4 w-4" />
      Aktualizuj aplikację
    </button>
  );
}
