"use client";

import { useEffect, useState } from "react";
import { RotateCw, Smartphone } from "lucide-react";

const PHONE_DISMISS_KEY = "iasv-mobile-warning-dismissed";

type ViewportMode = "phone" | "tablet-portrait" | "ok";

function getViewportMode(): ViewportMode {
  if (typeof window === "undefined") return "ok";

  if (window.matchMedia("(max-width: 767px)").matches) return "phone";
  if (window.matchMedia("(min-width: 768px) and (orientation: portrait)").matches) {
    return "tablet-portrait";
  }
  return "ok";
}

export default function ViewportGuidance() {
  const [mode, setMode] = useState<ViewportMode>("ok");
  const [phoneDismissed, setPhoneDismissed] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem(PHONE_DISMISS_KEY) === "1";
    setPhoneDismissed(dismissed);
    setMode(getViewportMode());

    const update = () => setMode(getViewportMode());
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  if (mode === "phone" && !phoneDismissed) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-6">
        <div className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
          <div className="mb-4 flex items-center gap-3">
            <Smartphone size={22} className="shrink-0 text-sky-400" />
            <h2 className="text-base font-semibold text-white">Klein scherm gedetecteerd</h2>
          </div>
          <p className="text-sm leading-relaxed text-gray-300">
            Voor de beste ervaring raden we aan deze simulator op een tablet of groot scherm te
            bekijken. Op een telefoon zijn de grafieken en bediening moeilijk te gebruiken.
          </p>
          <button
            type="button"
            className="mt-5 w-full rounded-lg bg-sky-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-500"
            onClick={() => {
              localStorage.setItem(PHONE_DISMISS_KEY, "1");
              setPhoneDismissed(true);
            }}
          >
            Toch doorgaan
          </button>
        </div>
      </div>
    );
  }

  if (mode === "tablet-portrait") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/95 p-6">
        <div className="w-full max-w-sm text-center">
          <RotateCw size={40} className="mx-auto mb-5 animate-pulse text-sky-400" />
          <h2 className="mb-3 text-lg font-semibold text-white">Draai uw tablet</h2>
          <p className="text-sm leading-relaxed text-gray-400">
            Voor de beste ervaring bekijkt u deze simulator het beste in landscape (liggende)
            modus.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
