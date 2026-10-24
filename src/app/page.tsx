"use client";

import ParameterPanel from "@/components/ParameterPanel";
import OtisWorkspace from "@/components/OtisWorkspace";
import WOBBreakdown from "@/components/WOBBreakdown";
import LungProtectionRadar from "@/components/LungProtectionRadar";
import PVAndTimeCurves from "@/components/PVAndTimeCurves";
import IASVDecisionPanel from "@/components/IASVDecisionPanel";
import { Activity } from "lucide-react";
import { useMemo } from "react";
import { useVentStore } from "@/store/ventStore";
import { calcIASV, calcLungProtection } from "@/lib/calculations";
import Link from "next/link";
import AppFooter from "@/components/AppFooter";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Top navigation bar */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Activity size={20} className="text-sky-400 shrink-0" />
          <div className="min-w-0 truncate">
            <span className="text-sm font-bold text-white tracking-tight">
              iASV Simulator
            </span>
            <span className="hidden md:inline text-xs text-gray-500 ml-2">
              Hamilton Medical — Intelligent Adaptive Support Ventilation
            </span>
          </div>
          <div className="ml-auto flex items-center gap-6 text-xs text-gray-500 shrink-0">
            <Link
              href="/theorie-iasv"
              className="rounded-md border border-sky-800 px-2.5 py-1 text-sky-300 hover:text-sky-200 hover:border-sky-600 transition-colors"
            >
              Theorie
            </Link>
            <div className="hidden xl:flex items-center gap-6">
              <span>Otis (1950)</span>
              <span className="text-gray-700">·</span>
              <span>Mead (1960)</span>
              <span className="text-gray-700">·</span>
              <span>Laubscher et al. (1994)</span>
            </div>
          </div>
        </div>
        <LiveSummaryBar />
      </header>

      {/* Main layout */}
      <main className="max-w-[1920px] mx-auto px-3 sm:px-4 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)_360px] gap-5">

        {/* ─── Linkerkolom: sliders (blijft in beeld vanaf lg) ──────────────── */}
        <aside className="space-y-5 lg:row-span-2 xl:row-span-1 lg:sticky lg:top-18 lg:self-start lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto lg:pr-1">
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
        <aside className="grid gap-5 content-start lg:col-start-2 lg:grid-cols-2 xl:col-start-auto xl:grid-cols-1">
          <IASVDecisionPanel />
          <LungProtectionRadar />
        </aside>
      </main>

      <AppFooter />
    </div>
  );
}

/** Compacte live-samenvatting onder de header op schermen waar de panelen onder elkaar staan. */
function LiveSummaryBar() {
  const params = useVentStore((s) => s.params);
  const iasv = useMemo(() => calcIASV(params), [params]);
  const prot = useMemo(
    () => calcLungProtection(params, iasv.measured.fBpm / 60, iasv.measured.vt),
    [params, iasv]
  );
  const status = !iasv.feasible ? "text-red-400" : iasv.constrained ? "text-orange-300" : "text-green-400";

  return (
    <div className="lg:hidden border-t border-gray-800 bg-gray-950/90">
      <div className="no-scrollbar px-4 py-1.5 flex items-center gap-x-4 overflow-x-auto whitespace-nowrap text-xs font-mono">
        <span className={status}>● iASV</span>
        <span className="text-gray-300">f {iasv.measured.fBpm.toFixed(1)}/min</span>
        <span className="text-gray-300">VT {(iasv.measured.vt * 1000).toFixed(0)} mL</span>
        <span className="text-gray-400">Pinsp {prot.peakPressure.toFixed(1)}</span>
        <span className="text-gray-400">ΔP {prot.drivingPressure.toFixed(1)}</span>
        <span className="text-gray-400">PEEPi {prot.autoPeep.toFixed(1)}</span>
      </div>
    </div>
  );
}

function FormulaCard() {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 sm:p-5 space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
        Kernformules
      </h3>

      <div className="space-y-3">
        <Formula
          title="Otis — Optimale frequentie"
          formula="π²τ·f² + f − V̇A/VD = 0"
          note="Minimaliseert inspiratoire arbeid/min bij constante V̇A (a = 2π², sinusoïdale flow)"
          accentClassName="text-yellow-400"
        />
        <Formula
          title="Mead — Optimale frequentie"
          formula="V̇A = VD·(2πτ)²·f³  ⇒  f = (V̇A/VD)^⅓·(2πτ)^−⅔"
          note="Minimaliseert de drukamplitude (kracht) per teug; ASV 1.1 weegt dit mee naast Otis"
          accentClassName="text-fuchsia-400"
        />
        <Formula
          title="Inspiratoire arbeid per adem"
          formula="W = VT²/(2C) + π²Rf·VT²/4 + PEEPi·VT"
          note="Elastisch + resistief + drempel (expiratie passief)"
          accentClassName="text-sky-400"
        />
        <Formula
          title="Tijdconstante"
          formula="τ = R · C"
          note="Bepaalt f_opt en het ASV-maximum f ≤ 20/τ"
          accentClassName="text-emerald-400"
        />
        <Formula
          title="Driving Pressure"
          formula="ΔP = VT / C"
          note="Didactische grens ≤ 15 cmH₂O (Amato 2015)"
          accentClassName="text-violet-400"
        />
        <Formula
          title="Auto-PEEP"
          formula="PEEPi = VT · y / (1 − y) / C,   y = e^(−Te/τ)"
          note="Ingesloten volume bij drukgecontroleerde teug, I:E 1:2"
          accentClassName="text-amber-400"
        />
        <Formula
          title="Mechanisch Vermogen"
          formula="MP = 0.098 · f · VT · Pinsp"
          note="Gattinoni 2016; bij blokdruk is ∫Paw·dV = Pinsp·VT — ~17 J/min (associatie)"
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
      <p className="text-xs font-mono text-gray-200 bg-gray-900 rounded-sm px-2 py-1 mb-1">{formula}</p>
      <p className="text-xs text-gray-500">{note}</p>
    </div>
  );
}
