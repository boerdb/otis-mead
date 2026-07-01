"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { useVentStore } from "@/store/ventStore";
import { calcIASV, generatePVLoop, generateTimeCurves } from "@/lib/calculations";
import { chartTooltipContentStyle } from "@/components/chartTooltipStyles";

export default function PVAndTimeCurves() {
  const params = useVentStore((s) => s.params);
  const iasv   = useMemo(() => calcIASV(params), [params]);

  const fHz    = iasv.fActual / 60;
  const vt     = iasv.vtActual;

  const pvLoop     = useMemo(() => generatePVLoop(params, fHz, vt), [params, fHz, vt]);
  const timeCurves = useMemo(() => generateTimeCurves(params, fHz, vt), [params, fHz, vt]);

  const totalPeep = params.peep + params.autoPeep;

  return (
    <div className="space-y-4">
      {/* PV-lus */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-3">
          Druk-Volume Lus (PV-loop)
        </h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={pvLoop} margin={{ top: 5, right: 15, left: 5, bottom: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="p"
              type="number"
              domain={[0, params.pLimit + 5]}
              label={{ value: "Druk (cmH₂O)", position: "insideBottomRight", offset: -5, fill: "#94a3b8", fontSize: 11 }}
              tick={{ fill: "#64748b", fontSize: 10 }}
            />
            <YAxis
              dataKey="v"
              type="number"
              domain={[0, (vt * 1200)]}
              label={{ value: "Volume (mL)", angle: -90, position: "insideLeft", fill: "#94a3b8", fontSize: 11 }}
              tick={{ fill: "#64748b", fontSize: 10 }}
            />
            <ReferenceLine x={totalPeep} stroke="#f59e0b" strokeDasharray="4 3" strokeWidth={1.5}
              label={{ value: "PEEP", fill: "#f59e0b", fontSize: 9 }} />
            <ReferenceLine x={params.pLimit} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1.5}
              label={{ value: "P_limit", fill: "#ef4444", fontSize: 9 }} />
            <Line
              dataKey="v"
              stroke="#0ea5e9"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              name="PV-lus"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Flow-tijd & Druk-tijd */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-3">
          Flow · Druk · Volume — tijdcurven (1 cyclus)
        </h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={timeCurves} margin={{ top: 5, right: 15, left: 5, bottom: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="t"
              type="number"
              tickFormatter={(v) => v.toFixed(2)}
              label={{ value: "Tijd (s)", position: "insideBottomRight", offset: -5, fill: "#94a3b8", fontSize: 11 }}
              tick={{ fill: "#64748b", fontSize: 10 }}
            />
            <YAxis
              yAxisId="flow"
              orientation="left"
              tick={{ fill: "#64748b", fontSize: 10 }}
              label={{ value: "Flow (L/s)", angle: -90, position: "insideLeft", fill: "#34d399", fontSize: 10 }}
              tickFormatter={(v) => v.toFixed(2)}
            />
            <YAxis
              yAxisId="pressure"
              orientation="right"
              tick={{ fill: "#64748b", fontSize: 10 }}
              label={{ value: "Druk (cmH₂O)", angle: 90, position: "insideRight", fill: "#f472b6", fontSize: 10 }}
              tickFormatter={(v) => v.toFixed(1)}
            />
            <YAxis
              yAxisId="volume"
              orientation="right"
              tick={{ fill: "#64748b", fontSize: 10 }}
              label={{ value: "Volume (mL)", angle: 90, position: "right", fill: "#94a3b8", fontSize: 10 }}
              tickFormatter={(v) => v.toFixed(0)}
            />
            <Tooltip
              contentStyle={chartTooltipContentStyle}
              labelFormatter={(label) => {
                const t = typeof label === "number" ? label.toFixed(2) : String(label ?? "");
                return `${t} s`;
              }}
              formatter={(val: unknown, name: unknown) => [typeof val === 'number' ? val.toFixed(3) : "—", String(name ?? "")]}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
            <Line
              yAxisId="flow"
              dataKey="flow"
              stroke="#34d399"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              name="Flow (L/s)"
            />
            <Line
              yAxisId="pressure"
              dataKey="pressure"
              stroke="#f472b6"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              name="Druk (cmH₂O)"
            />
            <Line
              yAxisId="volume"
              dataKey="volume"
              stroke="#94a3b8"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={false}
              isAnimationActive={false}
              name="Volume (mL)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
