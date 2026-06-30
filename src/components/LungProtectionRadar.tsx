"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
} from "recharts";
import { useVentStore } from "@/store/ventStore";
import { calcIASV, calcLungProtection } from "@/lib/calculations";

// Normaliseer elke maatstaf naar 0–100 (100 = perfect veilig)
function scoreDP(dp: number) {
  if (dp <= 10) return 100;
  if (dp >= 25) return 0;
  return 100 - ((dp - 10) / 15) * 100;
}
function scorePpeak(pp: number, limit: number) {
  if (pp <= limit * 0.8) return 100;
  if (pp >= limit) return 0;
  return 100 - ((pp - limit * 0.8) / (limit * 0.2)) * 100;
}
function scoreVtKg(vtkg: number) {
  if (vtkg <= 6) return 100;
  if (vtkg >= 10) return 0;
  return 100 - ((vtkg - 6) / 4) * 100;
}
function scoreMechPower(mp: number) {
  if (mp <= 10) return 100;
  if (mp >= 25) return 0;
  return 100 - ((mp - 10) / 15) * 100;
}
function scoreAutoPeep(ap: number, peep: number) {
  const ratio = peep > 0 ? ap / peep : ap;
  if (ratio <= 0.1) return 100;
  if (ratio >= 1) return 0;
  return 100 - ratio * 100;
}

export default function LungProtectionRadar() {
  const params = useVentStore((s) => s.params);
  const iasv   = useMemo(() => calcIASV(params), [params]);
  const prot   = useMemo(
    () => calcLungProtection(params, iasv.fActual / 60, iasv.vtActual),
    [params, iasv]
  );

  const data = [
    {
      subject: "Driving\nPressure",
      score: +scoreDP(prot.drivingPressure).toFixed(1),
      value: `${prot.drivingPressure.toFixed(1)} cmH₂O`,
      limit: "< 15",
    },
    {
      subject: "Ppeak /\nP-limiet",
      score: +scorePpeak(prot.peakPressure, params.pLimit).toFixed(1),
      value: `${prot.peakPressure.toFixed(1)} cmH₂O`,
      limit: `< ${params.pLimit}`,
    },
    {
      subject: "VT / kg",
      score: +scoreVtKg(prot.vtPerKg).toFixed(1),
      value: `${prot.vtPerKg.toFixed(1)} mL/kg`,
      limit: "< 8",
    },
    {
      subject: "Mechanisch\nVermogen",
      score: +scoreMechPower(prot.mechPower).toFixed(1),
      value: `${prot.mechPower.toFixed(2)} J/min`,
      limit: "< 17",
    },
    {
      subject: "Auto-PEEP\nRatio",
      score: +scoreAutoPeep(params.autoPeep, params.peep).toFixed(1),
      value: `${params.autoPeep} / ${params.peep} cmH₂O`,
      limit: "laag",
    },
  ];

  const overallScore = data.reduce((s, d) => s + d.score, 0) / data.length;

  const scoreColor =
    overallScore >= 75 ? "#4ade80" :
    overallScore >= 50 ? "#facc15" :
    "#ef4444";

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
            Longbescherming Radar
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">100 = volledig veilig</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Totaalscore</p>
          <p className="text-2xl font-bold font-mono" style={{ color: scoreColor }}>
            {overallScore.toFixed(0)}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
          <PolarGrid stroke="#1e293b" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#94a3b8", fontSize: 10 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: "#475569", fontSize: 9 }}
            tickCount={4}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke={scoreColor}
            fill={scoreColor}
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
            formatter={(val: unknown, _: unknown, props: { payload?: { value?: string; limit?: string } }) => [
              `${typeof val === 'number' ? val.toFixed(0) : '—'} / 100 — ${props.payload?.value ?? ""} (grens: ${props.payload?.limit ?? ""})`,
              "Score",
            ]}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Detail tabel */}
      <div className="mt-3 space-y-2">
        {data.map((d) => {
          const pct = d.score;
          const color = pct >= 75 ? "#4ade80" : pct >= 50 ? "#facc15" : "#ef4444";
          return (
            <div key={d.subject} className="flex items-center gap-3">
              <div className="w-44 text-xs text-gray-400">{d.subject.replace("\n", " ")}</div>
              <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
              <div className="w-32 text-right text-xs font-mono text-gray-300">{d.value}</div>
              <div className="w-16 text-right text-xs text-gray-500">grens {d.limit}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
