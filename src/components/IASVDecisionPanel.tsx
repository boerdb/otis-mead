"use client";

import { useMemo } from "react";
import { useVentStore } from "@/store/ventStore";
import { calcIASV, calcOtis, calcLungProtection, calcWOB } from "@/lib/calculations";
import { CheckCircle, AlertTriangle, XCircle, ArrowRight } from "lucide-react";

export default function IASVDecisionPanel() {
  const params = useVentStore((s) => s.params);
  const otis   = useMemo(() => calcOtis(params), [params]);
  const iasv   = useMemo(() => calcIASV(params), [params]);

  const protOtis = useMemo(
    () => calcLungProtection(params, otis.fOptHz, otis.vtOpt),
    [params, otis]
  );
  const protIASV = useMemo(
    () => calcLungProtection(params, iasv.fActual / 60, iasv.vtActual),
    [params, iasv]
  );
  const wobOtis  = useMemo(() => calcWOB(params, otis.fOptHz, otis.vtOpt), [params, otis]);
  const wobIASV  = useMemo(() => calcWOB(params, iasv.fActual / 60, iasv.vtActual), [params, iasv]);

  const steps = [
    {
      label: "Stap 1 — Otis Berekening",
      desc: `Optimale frequentie via: f = [−1 + √(1 + 8π²τ·V̇A/VD)] / (4π²τ)`,
      detail: `f_opt = ${otis.fOptBpm.toFixed(1)} bpm  |  VT_opt = ${(otis.vtOpt * 1000).toFixed(0)} mL`,
      status: "ok",
    },
    {
      label: "Stap 2 — Druk Limiet Check",
      desc: `Ppeak = PEEP_tot + VT/C + R·π·f·VT ≤ ${params.pLimit} cmH₂O`,
      detail: `Ppeak (Otis) = ${protOtis.peakPressure.toFixed(1)} cmH₂O`,
      status: protOtis.peakPressure <= params.pLimit ? "ok" : "warn",
    },
    {
      label: "Stap 3 — Driving Pressure Check",
      desc: "ΔP = VT / C ≤ 15 cmH₂O (longbeschermend)",
      detail: `ΔP = ${protOtis.drivingPressure.toFixed(1)} cmH₂O`,
      status: protOtis.drivingPressure <= 15 ? "ok" : "warn",
    },
    {
      label: "Stap 4 — VT/kg Veiligheidsgrens",
      desc: "VT ≤ 8 mL/kg IBW (ARDSnet protocol)",
      detail: `VT/kg = ${protOtis.vtPerKg.toFixed(1)} mL/kg  (IBW = ${params.ibw} kg)`,
      status: protOtis.vtPerKg <= 8 ? "ok" : "warn",
    },
    {
      label: "Stap 5 — Auto-PEEP Compensatie",
      desc: "WOB_intrinsic = PEEPi × VT (extra arbeid voor trigger)",
      detail: `PEEPi = ${params.autoPeep} cmH₂O  →  extra ${(params.autoPeep * iasv.vtActual * 0.098).toFixed(4)} J/adem`,
      status: params.autoPeep === 0 ? "ok" : params.autoPeep <= 5 ? "warn" : "error",
    },
    {
      label: "Stap 6 — iASV Definitieve Keuze",
      desc: iasv.constrained
        ? `Optimum bijgesteld: ${iasv.limitingFactor}`
        : "Otis-optimum ligt binnen alle veiligheidslimieten ✓",
      detail: `f = ${iasv.fActual.toFixed(1)} bpm  |  VT = ${(iasv.vtActual * 1000).toFixed(0)} mL`,
      status: iasv.constrained ? "warn" : "ok",
    },
  ];

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 space-y-5">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
          iASV Beslissingsalgoritme
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Live stap-voor-stap keuzeproces van Hamilton iASV
        </p>
      </div>

      {/* Beslisboom stappen */}
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`flex gap-3 p-3 rounded-xl border transition-colors ${
              step.status === "ok"
                ? "bg-green-950/20 border-green-800/30"
                : step.status === "warn"
                ? "bg-yellow-950/20 border-yellow-800/30"
                : "bg-red-950/20 border-red-800/30"
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {step.status === "ok"   && <CheckCircle   size={16} className="text-green-400" />}
              {step.status === "warn" && <AlertTriangle size={16} className="text-yellow-400" />}
              {step.status === "error"&& <XCircle       size={16} className="text-red-400" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-200">{step.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
              <p className="text-xs font-mono text-gray-300 mt-1 bg-gray-800 rounded px-2 py-1">
                {step.detail}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Vergelijking Otis vs iASV */}
      <div className="border-t border-gray-700 pt-4">
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">
          Vergelijking Otis-optimum vs iASV werkpunt
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-gray-700">
                <th className="text-left py-1 pr-3 font-medium">Parameter</th>
                <th className="text-right py-1 px-3 font-medium text-yellow-400">Otis</th>
                <th className="text-center py-1 px-1"><ArrowRight size={12} className="text-gray-600 inline" /></th>
                <th className="text-right py-1 px-3 font-medium text-green-400">iASV</th>
                <th className="text-right py-1 pl-3 font-medium">Grens</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              <CompRow label="Frequentie"    otis={`${otis.fOptBpm.toFixed(1)} bpm`}           iasv={`${iasv.fActual.toFixed(1)} bpm`}         limit="—" />
              <CompRow label="VT"            otis={`${(otis.vtOpt*1000).toFixed(0)} mL`}       iasv={`${(iasv.vtActual*1000).toFixed(0)} mL`}  limit="≤ 8 mL/kg" />
              <CompRow label="VT/kg"         otis={`${protOtis.vtPerKg.toFixed(1)} mL/kg`}     iasv={`${protIASV.vtPerKg.toFixed(1)} mL/kg`}   limit="≤ 8" warn={protOtis.vtPerKg > 8} />
              <CompRow label="Ppeak"         otis={`${protOtis.peakPressure.toFixed(1)} cmH₂O`} iasv={`${protIASV.peakPressure.toFixed(1)} cmH₂O`} limit={`≤ ${params.pLimit}`} warn={protOtis.peakPressure > params.pLimit} />
              <CompRow label="ΔP (driving)"  otis={`${protOtis.drivingPressure.toFixed(1)} cmH₂O`} iasv={`${protIASV.drivingPressure.toFixed(1)} cmH₂O`} limit="≤ 15" warn={protOtis.drivingPressure > 15} />
              <CompRow label="WOB"           otis={`${wobOtis.perMinute.toFixed(3)} J/min`}    iasv={`${wobIASV.perMinute.toFixed(3)} J/min`}  limit="min" />
              <CompRow label="Mech. vermogen" otis={`${protOtis.mechPower.toFixed(2)} J/min`}  iasv={`${protIASV.mechPower.toFixed(2)} J/min`}  limit="≤ 17" warn={protIASV.mechPower > 17} />
            </tbody>
          </table>
        </div>
      </div>

      {/* Score badges */}
      <div className="grid grid-cols-2 gap-3">
        <ScoreBadge label="WOB-efficiëntie" score={iasv.wobScore} />
        <ScoreBadge label="Longbescherming" score={iasv.protectionScore} />
      </div>
    </div>
  );
}

function CompRow({
  label, otis, iasv, limit, warn = false,
}: {
  label: string; otis: string; iasv: string; limit: string; warn?: boolean;
}) {
  return (
    <tr className="hover:bg-gray-800/30">
      <td className="py-1.5 pr-3 text-gray-400">{label}</td>
      <td className={`text-right px-3 font-mono ${warn ? "text-red-400" : "text-yellow-300"}`}>{otis}</td>
      <td className="text-center px-1 text-gray-700">→</td>
      <td className="text-right px-3 font-mono text-green-300">{iasv}</td>
      <td className="text-right pl-3 text-gray-500">{limit}</td>
    </tr>
  );
}

function ScoreBadge({ label, score }: { label: string; score: number }) {
  const color = score >= 75 ? "#4ade80" : score >= 50 ? "#facc15" : "#ef4444";
  const bg    = score >= 75 ? "bg-green-950/30 border-green-700/30"
              : score >= 50 ? "bg-yellow-950/30 border-yellow-700/30"
              : "bg-red-950/30 border-red-700/30";
  return (
    <div className={`rounded-xl border p-3 ${bg}`}>
      <p className="text-xs text-gray-400">{label}</p>
      <div className="flex items-end gap-2 mt-1">
        <p className="text-2xl font-bold font-mono" style={{ color }}>{score.toFixed(0)}</p>
        <p className="text-xs text-gray-500 mb-0.5">/ 100</p>
      </div>
      <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
    </div>
  );
}
