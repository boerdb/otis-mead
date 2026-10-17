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
import { calcIASV, calcLungProtection, calcProtectionScores } from "@/lib/calculations";
import { chartTooltipContentStyle } from "@/components/chartTooltipStyles";

/** Groen ruim veilig, geel tot en met de grens (score 50), rood erboven. */
function scoreColor(score: number) {
  return score >= 75 ? "#4ade80" : score >= 49.5 ? "#facc15" : "#ef4444";
}

export default function LungProtectionRadar() {
  const params = useVentStore((s) => s.params);
  const iasv   = useMemo(() => calcIASV(params), [params]);
  const scores = useMemo(
    () => calcProtectionScores(
      params,
      calcLungProtection(params, iasv.measured.fBpm / 60, iasv.measured.vt)
    ),
    [params, iasv]
  );

  const overall = scores.reduce((sum, x) => sum + x.score, 0) / scores.length;
  const color   = scoreColor(overall);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
            Longbescherming
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Gemeten teug · per maat: 100 = ruim veilig, 50 = op de grens, 0 = ver erboven
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-gray-500">Gemiddeld</p>
          <p className="text-2xl font-bold font-mono" style={{ color }}>
            {overall.toFixed(0)}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <RadarChart data={scores} margin={{ top: 10, right: 52, left: 52, bottom: 10 }} outerRadius="68%">
          <PolarGrid stroke="#1e293b" />
          <PolarAngleAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 10 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Score"
            dataKey="score"
            stroke={color}
            fill={color}
            fillOpacity={0.25}
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Tooltip
            contentStyle={chartTooltipContentStyle}
            formatter={(val: unknown, _: unknown, item: { payload?: { value?: string; limit?: string } }) => [
              `${typeof val === "number" ? val.toFixed(0) : "—"} — ${item.payload?.value ?? ""} (grens ${item.payload?.limit ?? ""})`,
              "Score",
            ]}
          />
        </RadarChart>
      </ResponsiveContainer>

      <div className="mt-3 space-y-2">
        {scores.map((s) => (
          <div key={s.key} className="grid grid-cols-[minmax(0,7rem)_1fr_auto] items-center gap-3">
            <span className="text-xs text-gray-400 truncate">{s.label}</span>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${s.score}%`, background: scoreColor(s.score) }}
              />
            </div>
            <span className="text-xs font-mono text-gray-300 text-right whitespace-nowrap">
              {s.value} <span className="text-gray-500">{s.limit}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
