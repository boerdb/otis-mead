"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

const DISMISS_KEY = "iasv-install-dismissed-at";
const DISMISS_DAYS = 14;

/** Chromium-event dat het systeem-installatievenster kan openen. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function recentlyDismissed(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return at > 0 && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

/**
 * Stelt op Android voor om de simulator als app te installeren.
 * Registreert ook de service worker (alleen in productie).
 */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Zonder service worker werkt de site gewoon, alleen niet offline.
      });
    }

    if (isStandalone() || recentlyDismissed() || !/Android/i.test(navigator.userAgent)) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      // Even wachten, zodat de pagina eerst rustig in beeld komt.
      timer = setTimeout(() => setVisible(true), 2500);
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!visible || !deferred) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Opslag niet beschikbaar: alleen voor deze sessie verborgen.
    }
  };

  const install = async () => {
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
    if (outcome === "dismissed") dismiss();
  };

  return (
    <div
      role="dialog"
      aria-label="App installeren"
      className="fixed inset-x-3 z-110 mx-auto max-w-md rounded-2xl border border-gray-700 bg-gray-900/95 p-3 shadow-2xl backdrop-blur-sm"
      style={{ top: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" width={44} height={44} className="shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-100">iASV Simulator als app</p>
          <p className="text-xs leading-snug text-gray-400">
            Open hem voortaan vanaf je startscherm, in een eigen venster.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Sluiten"
          className="-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-800 hover:text-gray-200"
        >
          <X size={18} aria-hidden />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={dismiss}
          className="flex-1 rounded-lg border border-gray-700 px-3 py-2 text-sm font-medium text-gray-300 transition hover:bg-gray-800"
        >
          Niet nu
        </button>
        <button
          type="button"
          onClick={install}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-gray-950 transition hover:bg-sky-400"
        >
          <Download size={16} aria-hidden />
          Installeren
        </button>
      </div>
    </div>
  );
}
