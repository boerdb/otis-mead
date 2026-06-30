"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  Legend,
} from "recharts";
import { useVentStore } from "@/store/ventStore";
import { calcOtis, calcWOB, calcIASV } from "@/lib/calculations";

export default function WOBBreakdown() {
  const params = useVentStore((s) => s.params);

  const otis  = useMemo(() => calcOtis(params), [params]);
  const iasv  = useMemo(() => calcIASV(params), [params]);

  const wobOtis = useMemo(
    () => calcWOB(params, otis.fOptHz, otis.vtOpt),
    [params, otis]
  );
  const wobIASV = useMemo(
    () => calcWOB(params, iasv.fActual / 60, iasv.vtActual),
    [params, iasv]
  );

  const data = [
    {
      name: "Otis-optimum",
      Elastisch:  +wobOtis.elastic.toFixed(4),
      Resistief:  +wobOtis.resistive.toFixed(4),
      "Auto-PEEP": +wobOtis.intrinsic.toFixed(4),
    },
    {
      name: "iASV Werkpunt",
      Elastisch:  +wobIASV.elastic.toFixed(4),
      Resistief:  +wobIASV.resistive.toFixed(4),
      "Auto-PEEP": +wobIASV.intrinsic.toFixed(4),
    },
  ];

  const fmt = (v: number) => v.toFixed(4);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
      <div className="mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
          WOB Verdeling — per minuut (J/min)
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Elastisch · Resistief · Intrinsiek PEEP-component
        </p>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="name"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 11 }}
            label={{ value: "J/min", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 11 }}
            tickFormatter={(v) => v.toFixed(3)}
          />
          <Tooltip
            contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
            formatter={(val: unknown, name: unknown) => [typeof val === 'number' ? `${fmt(val)} J/min` : "—", String(name ?? "")]}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
          <Bar dataKey="Elastisch" stackId="a" fill="#0ea5e9" />
          <Bar dataKey="Resistief" stackId="a" fill="#a78bfa" />
          <Bar dataKey="Auto-PEEP" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Totalen */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <WOBCard
          label="Otis-optimum WOB"
          perBreath={wobOtis.perBreath}
          perMinute={wobOtis.perMinute}
          color="#facc15"
        />
        <WOBCard
          label="iASV WOB"
          perBreath={wobIASV.perBreath}
          perMinute={wobIASV.perMinute}
          color="#4ade80"
        />
      </div>

      {/* WOB formule uitleg */}
      <div className="mt-4 bg-gray-800 rounded-xl p-3 space-y-1">
        <p className="text-xs text-gray-400 font-semibold">Otis-formule (sinusoïdaal profiel)</p>
        <p className="text-xs text-gray-500 font-mono">
          W = VT² / (2C) + π²·R·f·VT²/2 + PEEPi·VT
        </p>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <MiniStat label="C (compliance)" value={`${otis.compliance.toFixed(3)} L/cmH₂O`} />
          <MiniStat label="τ = RC" value={`${otis.tau.toFixed(2)} s`} />
          <MiniStat label="V̇A" value={`${params.vaTarget.toFixed(1)} L/min`} />
        </div>
      </div>
    </div>
  );
}

function WOBCard({
  label, perBreath, perMinute, color,
}: {
  label: string; perBreath: number; perMinute: number; color: string;
}) {
  return (
    <div className="bg-gray-800 rounded-xl p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-base font-mono font-bold mt-0.5" style={{ color }}>
        {perMinute.toFixed(3)} J/min
      </p>
      <p className="text-xs text-gray-500 font-mono">
        {(perBreath * 1000).toFixed(2)} mJ/adem
      </p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-600">{label}</p>
      <p className="text-xs text-gray-300 font-mono">{value}</p>
    </div>
  );
}
