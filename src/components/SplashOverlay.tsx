"use client";

import { useEffect, useState } from "react";

/** Logo-vlak in CSS-pixels; gelijk aan LOGO_CSS in scripts/generate-splash.mjs. */
const LOGO_SIZE = 168;
/** Minimaal zichtbaar: de naam staat dan ruim een seconde volledig in beeld. */
const MIN_VISIBLE_MS = 1900;

/**
 * Met statusBarStyle "black" begint de app onder de statusbalk, het opstartbeeld van iOS niet.
 * Dit script schuift het logo vóór het eerste beeld een halve statusbalk omhoog, zodat het
 * precies op de plek van het opstartbeeld staat.
 */
const SHIFT_SCRIPT = `try{var s=Math.max(0,Math.min(80,(screen.height-window.innerHeight)/2));document.documentElement.style.setProperty('--splash-shift',s+'px')}catch(e){}`;

/**
 * Opstartscherm in de app (alleen als geïnstalleerde PWA, zie .pwa-splash in globals.css).
 * Neemt het opstartbeeld van iOS naadloos over: zelfde verloop, zelfde logo op dezelfde plek.
 * Daarna verschijnt de naam en vervaagt alles naar de app. Tikken slaat het over.
 */
export default function SplashOverlay() {
  const [phase, setPhase] = useState<"show" | "out" | "gone">("show");

  useEffect(() => {
    const skip = () => setPhase((p) => (p === "show" ? "out" : p));
    window.addEventListener("pointerdown", skip, { once: true });
    const started = performance.now();
    let outTimer = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finish = () => {
      const wait = Math.max(0, (reduced ? 200 : MIN_VISIBLE_MS) - (performance.now() - started));
      outTimer = window.setTimeout(() => setPhase("out"), wait);
    };
    if (document.readyState === "complete") finish();
    else window.addEventListener("load", finish, { once: true });
    return () => {
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("load", finish);
      window.clearTimeout(outTimer);
    };
  }, []);

  useEffect(() => {
    if (phase !== "out") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => setPhase("gone"), reduced ? 0 : 550);
    return () => window.clearTimeout(t);
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <div className={`pwa-splash ${phase === "out" ? "pwa-splash-out" : ""}`} aria-hidden>
      <script dangerouslySetInnerHTML={{ __html: SHIFT_SCRIPT }} />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="splash-bg" x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0" stopColor="#38bdf8" />
            <stop offset="1" stopColor="#0c3a5e" />
          </linearGradient>
          <radialGradient id="splash-glow" cx="0.5" cy="0.42" r="0.6">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.16" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill="url(#splash-bg)" />
        <rect width="100" height="100" fill="url(#splash-glow)" />
      </svg>
      {/* viewBox zo gekozen dat het midden van de tekening (256, 286) in het midden staat. */}
      <svg
        className="pwa-splash-logo"
        width={LOGO_SIZE}
        height={LOGO_SIZE}
        viewBox="0 30 512 512"
        style={{ marginLeft: -LOGO_SIZE / 2, marginTop: -LOGO_SIZE / 2 }}
      >
        <path d="M96 352 H408" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="10" strokeLinecap="round" />
        <path
          d="M96 352 H142 C156 352 160 176 196 168 H292 C312 168 318 214 330 262 C342 314 356 352 386 352 H416"
          fill="none"
          stroke="#ffffff"
          strokeWidth="30"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M96 404 H160 C174 404 178 300 206 300 C246 300 270 404 300 404 H416"
          fill="none"
          stroke="#5eead4"
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
        />
        <circle cx="244" cy="168" r="26" fill="#fbbf24" stroke="#ffffff" strokeWidth="10" />
      </svg>
      <div className="pwa-splash-title" style={{ top: `calc(50% - var(--splash-shift, 0px) + ${LOGO_SIZE / 2 - 6}px)` }}>
        <p className="text-[1.375rem] font-semibold tracking-tight">iASV Simulator</p>
        <p className="mt-1 text-sm opacity-75">Hamilton Otis-Mead</p>
      </div>
    </div>
  );
}
