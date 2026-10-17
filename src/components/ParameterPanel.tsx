"use client";

import { useVentStore } from "@/store/ventStore";
import type { VentilatorParams } from "@/lib/types";
import { RotateCcw } from "lucide-react";
import { calcTau } from "@/lib/calculations";

interface SliderDef {
  key: keyof VentilatorParams;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  description: string;
  color: string;
}

const SLIDERS: SliderDef[] = [
  {
    key: "peep",
    label: "PEEP",
    unit: "cmH₂O",
    min: 0, max: 20, step: 0.5,
    description: "Positieve eindexpiratoire druk",
    color: "#0ea5e9",
  },
  {
    key: "autoPeep",
    label: "Auto-PEEP (PEEPi)",
    unit: "cmH₂O",
    min: 0, max: 15, step: 0.5,
    description: "Intrinsiek auto-PEEP door onvolledige expiratie",
    color: "#f59e0b",
  },
  {
    key: "pLimit",
    label: "Druk Limiet",
    unit: "cmH₂O",
    min: 15, max: 50, step: 1,
    description: "Maximale piekdruk / bovenste drukgrens",
    color: "#ef4444",
  },
  {
    key: "resistance",
    label: "Weerstand (R)",
    unit: "cmH₂O·s/L",
    min: 2, max: 30, step: 0.5,
    description: "Inclusief tube (geïntubeerd normaal 5–10, obstructief > 15)",
    color: "#a78bfa",
  },
  {
    key: "compliance",
    label: "Compliance (C)",
    unit: "mL/cmH₂O",
    min: 10, max: 120, step: 1,
    description: "Statische compliance (ARDS 20–40, normaal 50–80 bij IC-patiënt)",
    color: "#34d399",
  },
  {
    key: "ibw",
    label: "Ideaal Gewicht (IBW)",
    unit: "kg",
    min: 40, max: 120, step: 1,
    description: "Bepaalt dead space en VT/kg-grens",
    color: "#fb923c",
  },
  {
    key: "vaTarget",
    label: "V̇A Target",
    unit: "L/min",
    min: 2, max: 12, step: 0.25,
    description: "Gewenst alveolair minuutvolume",
    color: "#f472b6",
  },
];

export default function ParameterPanel() {
  const { params, setParam, resetParams } = useVentStore();

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
            Parameters
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Verschuif om iASV live te simuleren</p>
        </div>
        <button
          onClick={resetParams}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-sky-400 transition-colors"
          title="Reset naar standaard"
        >
          <RotateCcw size={13} />
          Reset
        </button>
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        {SLIDERS.map((s) => {
          const value = params[s.key] as number;
          const pct   = ((value - s.min) / (s.max - s.min)) * 100;

          return (
            <div key={String(s.key)} className="space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-gray-200">{s.label}</span>
                <span
                  className="text-sm font-mono font-bold"
                  style={{ color: s.color }}
                >
                  {value.toFixed(2).replace(/\.?0+$/, "")} {s.unit}
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-none">{s.description}</p>
              <div className="relative pt-1">
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={value}
                  onChange={(e) => setParam(s.key as keyof VentilatorParams, parseFloat(e.target.value))}
                  className="w-full"
                  style={{
                    background: `linear-gradient(to right, ${s.color} 0%, ${s.color} ${pct}%, #1e293b ${pct}%, #1e293b 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-gray-600 mt-0.5">
                  <span>{s.min}</span>
                  <span>{s.max}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Afgeleide grootheden */}
      <div className="border-t border-gray-700 pt-4 grid grid-cols-2 gap-3">
        <DerivedValue
          label="Tijdconstante τ = R·C"
          value={calcTau(params).toFixed(2)}
          unit="s"
          color="#94a3b8"
        />
        <DerivedValue
          label="Totaal PEEP"
          value={(params.peep + params.autoPeep).toFixed(1)}
          unit="cmH₂O"
          color="#fbbf24"
        />
      </div>
    </div>
  );
}

function DerivedValue({
  label, value, unit, color,
}: {
  label: string; value: string; unit: string; color: string;
}) {
  return (
    <div className="bg-gray-800 rounded-lg p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-base font-mono font-bold mt-0.5" style={{ color }}>
        {value}
        <span className="text-xs text-gray-400 ml-1">{unit}</span>
      </p>
    </div>
  );
}
