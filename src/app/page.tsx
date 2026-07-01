"use client";

import ParameterPanel from "@/components/ParameterPanel";
import OtisWorkspace from "@/components/OtisWorkspace";
import WOBBreakdown from "@/components/WOBBreakdown";
import LungProtectionRadar from "@/components/LungProtectionRadar";
import PVAndTimeCurves from "@/components/PVAndTimeCurves";
import IASVDecisionPanel from "@/components/IASVDecisionPanel";
import { Activity } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Top navigation bar */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-6 h-14 flex items-center gap-4">
          <Activity size={20} className="text-sky-400" />
          <div>
            <span className="text-sm font-bold text-white tracking-tight">
              iASV Simulator
            </span>
            <span className="text-xs text-gray-500 ml-2">
              Hamilton Medical — Intelligent Adaptive Support Ventilation
            </span>
          </div>
          <div className="ml-auto flex items-center gap-6 text-xs text-gray-500">
            <Link
              href="/theorie-iasv"
              className="text-sky-300 hover:text-sky-200 transition-colors"
            >
              iASV Theorie
            </Link>
            <span className="text-gray-700">|</span>
            <span>Otis (1950)</span>
            <span className="text-gray-700">·</span>
            <span>Mead (1960)</span>
            <span className="text-gray-700">·</span>
            <span>Brunner & Laubscher (1993)</span>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <main className="max-w-[1920px] mx-auto px-4 py-6 grid grid-cols-1 xl:grid-cols-[340px_1fr_360px] gap-5">

        {/* ─── Linkerkolom: sliders ─────────────────────────────────────────── */}
        <aside className="space-y-5">
          <ParameterPanel />
          <FormulaCard />
        </aside>

        {/* ─── Middelste kolom: grafieken ───────────────────────────────────── */}
        <section className="space-y-5 min-w-0">
          <OtisWorkspace />
          <WOBBreakdown />
          <PVAndTimeCurves />
        </section>

        {/* ─── Rechterkolom: beslissing & radar ─────────────────────────────── */}
        <aside className="space-y-5">
          <IASVDecisionPanel />
          <LungProtectionRadar />
        </aside>
      </main>

      <footer className="border-t border-gray-800 py-4 text-center text-xs text-gray-600">
        Educatieve simulator — niet voor klinisch gebruik
        <span className="mx-2 text-gray-700">·</span>
        © 2026 ClearVision, copyright houder
      </footer>
    </div>
  );
}

function FormulaCard() {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
        Kernformules
      </h3>

      <div className="space-y-3">
        <Formula
          title="Otis — Optimale frequentie"
          formula="2π²τ·f² + f − V̇A/VD = 0"
          note="Minimiseert WOB/min bij constante V̇A"
          accentClassName="text-yellow-400"
        />
        <Formula
          title="WOB per adem (Mead)"
          formula="W = VT²/(2C) + π²Rf·VT²/2 + PEEPi·VT"
          note="Elastisch + Resistief + Intrinsiek"
          accentClassName="text-sky-400"
        />
        <Formula
          title="Compliance"
          formula="C = τ / R = RC_exp / R"
          note="Afgeleide van tijdconstante"
          accentClassName="text-emerald-400"
        />
        <Formula
          title="Driving Pressure"
          formula="ΔP = VT / C"
          note="Longbeschermend < 15 cmH₂O"
          accentClassName="text-violet-400"
        />
        <Formula
          title="Mechanisch Vermogen"
          formula="MP = 0.098 · f · VT · (Ppeak − PEEP/2)"
          note="Gattinoni 2016 — grens 17 J/min"
          accentClassName="text-pink-400"
        />
      </div>
    </div>
  );
}

function Formula({
  title, formula, note, accentClassName,
}: {
  title: string; formula: string; note: string; accentClassName: string;
}) {
  return (
    <div className="bg-gray-800 rounded-xl p-3">
      <p className={`text-xs font-semibold mb-1 ${accentClassName}`}>{title}</p>
      <p className="text-xs font-mono text-gray-200 bg-gray-900 rounded px-2 py-1 mb-1">{formula}</p>
      <p className="text-xs text-gray-500">{note}</p>
    </div>
  );
}
