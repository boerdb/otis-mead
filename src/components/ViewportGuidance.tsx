"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Monitor, X } from "lucide-react";

const DISMISS_KEY = "iasv-small-screen-hint-dismissed";

function isSmallScreen(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 1023px)").matches;
}

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

/** Kleine, sluitbare hint op smalle schermen; de simulator blijft gewoon bruikbaar. */
export default function ViewportGuidance() {
  const pathname = usePathname();
  const [small, setSmall] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(readDismissed());
    setSmall(isSmallScreen());

    const update = () => setSmall(isSmallScreen());
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  // Alleen relevant voor de simulator; de theoriepagina is gewoon een leespagina.
  if (pathname !== "/" || !small || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Opslag niet beschikbaar: de hint verdwijnt alleen voor deze sessie.
    }
  };

  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-3 z-[100] flex items-start gap-3 rounded-xl border border-gray-700 bg-gray-900/95 p-3 shadow-2xl backdrop-blur sm:left-auto sm:right-4 sm:max-w-sm"
    >
      <Monitor size={18} className="mt-0.5 shrink-0 text-sky-400" />
      <p className="text-xs leading-relaxed text-gray-300">
        Op een groot scherm staan parameters, grafieken en beslissing naast elkaar. Op dit scherm staan ze onder elkaar; de balk bovenaan toont het actuele werkpunt.
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Melding sluiten"
        className="-m-1 shrink-0 rounded p-1 text-gray-400 hover:text-white"
      >
        <X size={16} />
      </button>
    </div>
  );
}
