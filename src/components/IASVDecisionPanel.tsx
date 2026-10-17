"use client";

import { useMemo } from "react";
import { useVentStore } from "@/store/ventStore";
import { LIMITS, calcIASV, calcOtis, calcLungProtection, calcWOB } from "@/lib/calculations";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

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
      desc: `Optimale frequentie via: f = [√(1 + 4π²τ·V̇A/VD) − 1] / (2π²τ)`,
      detail: `f_opt = ${otis.fOptBpm.toFixed(1)} bpm  |  VT_opt = ${(otis.vtOpt * 1000).toFixed(0)} mL`,
      status: "ok",
    },
    {
      label: "Stap 2 — ASV-venster",
      desc: "5 ≤ f ≤ 20/τ bpm (Te ≥ 2τ) en VT ≥ 2 × VD",
      detail: `f: ${iasv.fMinBpm.toFixed(0)}–${iasv.fMaxBpm.toFixed(1)} bpm  |  VT_min = ${(iasv.vtMin * 1000).toFixed(0)} mL`,
      status:
        otis.fOptBpm >= iasv.fMinBpm && otis.fOptBpm <= iasv.fMaxBpm && otis.vtOpt >= iasv.vtMin
          ? "ok"
          : "warn",
    },
    {
      label: "Stap 3 — Druk Limiet Check",
      desc: `Pinsp = PEEP + ΔPinsp ≤ ${params.pLimit} cmH₂O (drukgecontroleerd, I:E 1:2)`,
      detail: `Pinsp (Otis) = ${protOtis.peakPressure.toFixed(1)} cmH₂O`,
      status: protOtis.peakPressure <= params.pLimit ? "ok" : "warn",
    },
    {
      label: "Stap 4 — Driving Pressure en Plateau",
      desc: `ΔP = VT / C ≤ ${LIMITS.drivingPressure} en Pplat ≤ ${LIMITS.platPressure} cmH₂O`,
      detail: `ΔP = ${protOtis.drivingPressure.toFixed(1)}  |  Pplat = ${protOtis.platPressure.toFixed(1)} cmH₂O`,
      status:
        protOtis.drivingPressure <= LIMITS.drivingPressure && protOtis.platPressure <= LIMITS.platPressure
          ? "ok"
          : "warn",
    },
    {
      label: "Stap 5 — VT/kg Veiligheidsgrens",
      desc: `VT ≤ ${LIMITS.vtPerKg} mL/kg IBW (didactische grens; ARDSnet streeft 6 mL/kg na)`,
      detail: `VT/kg = ${protOtis.vtPerKg.toFixed(1)} mL/kg  (IBW = ${params.ibw} kg)`,
      status: protOtis.vtPerKg <= LIMITS.vtPerKg ? "ok" : "warn",
    },
    {
      label: "Stap 6 — Auto-PEEP",
      desc: "Onvolledige expiratie binnen Te = ⅔ van de cyclus; PEEPi = ingesloten volume / C",
      detail: `PEEPi (iASV) = ${protIASV.autoPeep.toFixed(1)} cmH₂O  |  drempelwerk ${(wobIASV.intrinsic * 1000).toFixed(1)} mJ/adem`,
      status: protIASV.autoPeep < 1 ? "ok" : protIASV.autoPeep <= LIMITS.autoPeep ? "warn" : "error",
    },
    {
      label: "Stap 7 — iASV Definitieve Keuze",
      desc: !iasv.feasible
        ? iasv.limitingFactor
        : iasv.constrained
        ? `Optimum bijgesteld: ${iasv.limitingFactor}`
        : "Otis-optimum ligt binnen alle veiligheidslimieten ✓",
      detail: `f = ${iasv.fActual.toFixed(1)} bpm  |  VT = ${(iasv.vtActual * 1000).toFixed(0)} mL`,
      status: !iasv.feasible ? "error" : iasv.constrained ? "warn" : "ok",
    },
    ...(params.fSpont > 0
      ? [{
          label: "Stap 8 — Eigen ademactiviteit",
          desc: iasv.measured.spontaneous
            ? `Patiënt ademt ${params.fSpont}/min, boven het doel: alle teugen spontaan, minuutvolume ${iasv.minuteVolume.toFixed(2)} L/min blijft gelijk`
            : `Patiënt ademt ${params.fSpont}/min, onder het doel: ASV vult aan met verplichte teugen`,
          detail: iasv.measured.spontaneous
            ? `gemeten f = ${iasv.measured.fBpm.toFixed(0)}  |  VT = ${(iasv.measured.vt * 1000).toFixed(0)} mL  |  V̇A = ${iasv.measured.alveolarVentilation.toFixed(2)} L/min`
            : `${iasv.measured.mandatoryBpm.toFixed(1)} verplichte + ${params.fSpont} spontane teugen/min`,
          status: iasv.measured.spontaneous && iasv.measured.vt < iasv.vtMin ? "error"
            : iasv.measured.spontaneous ? "warn" : "ok",
        }]
      : []),
  ];

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 sm:p-5 space-y-5">
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
                <th className="text-left py-1 pr-2 font-medium">Parameter</th>
                <th className="text-right py-1 px-2 font-medium text-yellow-400">Otis</th>
                <th className="text-right py-1 px-2 font-medium text-green-400">iASV</th>
                <th className="text-right py-1 pl-2 font-medium">Grens</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              <CompRow label="f (/min)" otis={`${otis.fOptBpm.toFixed(1)}`} iasv={`${iasv.fActual.toFixed(1)}`} limit={`≤ ${iasv.fMaxBpm.toFixed(0)}`} />
              <CompRow label="VT (mL)" otis={`${(otis.vtOpt * 1000).toFixed(0)}`} iasv={`${(iasv.vtActual * 1000).toFixed(0)}`} limit={`≥ ${(iasv.vtMin * 1000).toFixed(0)}`} />
              <CompRow label="VT/kg (mL/kg)" otis={`${protOtis.vtPerKg.toFixed(1)}`} iasv={`${protIASV.vtPerKg.toFixed(1)}`} limit={`≤ ${LIMITS.vtPerKg}`} warn={protOtis.vtPerKg > LIMITS.vtPerKg} />
              <CompRow label="Pinsp (cmH₂O)" otis={`${protOtis.peakPressure.toFixed(1)}`} iasv={`${protIASV.peakPressure.toFixed(1)}`} limit={`≤ ${params.pLimit}`} warn={protOtis.peakPressure > params.pLimit} />
              <CompRow label="Pplat (cmH₂O)" otis={`${protOtis.platPressure.toFixed(1)}`} iasv={`${protIASV.platPressure.toFixed(1)}`} limit={`≤ ${LIMITS.platPressure}`} warn={protOtis.platPressure > LIMITS.platPressure} />
              <CompRow label="ΔP (cmH₂O)" otis={`${protOtis.drivingPressure.toFixed(1)}`} iasv={`${protIASV.drivingPressure.toFixed(1)}`} limit={`≤ ${LIMITS.drivingPressure}`} warn={protOtis.drivingPressure > LIMITS.drivingPressure} />
              <CompRow label="PEEPi (cmH₂O)" otis={`${protOtis.autoPeep.toFixed(1)}`} iasv={`${protIASV.autoPeep.toFixed(1)}`} limit={`≤ ${LIMITS.autoPeep}`} warn={protOtis.autoPeep > LIMITS.autoPeep} />
              <CompRow label="WOB (J/min)" otis={`${wobOtis.perMinute.toFixed(2)}`} iasv={`${wobIASV.perMinute.toFixed(2)}`} limit="min" />
              <CompRow label="MP (J/min)" otis={`${protOtis.mechPower.toFixed(1)}`} iasv={`${protIASV.mechPower.toFixed(1)}`} limit={`≤ ${LIMITS.mechPower}`} warn={protOtis.mechPower > LIMITS.mechPower} />
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
      <td className="py-1.5 pr-2 text-gray-400 whitespace-nowrap">{label}</td>
      <td className={`text-right px-2 font-mono whitespace-nowrap ${warn ? "text-red-400" : "text-yellow-300"}`}>{otis}</td>
      <td className="text-right px-2 font-mono whitespace-nowrap text-green-300">{iasv}</td>
      <td className="text-right pl-2 text-gray-500 whitespace-nowrap">{limit}</td>
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
