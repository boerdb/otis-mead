"use client";

import { useVentStore } from "@/store/ventStore";
import type { DoelModel, VentilatorParams } from "@/lib/types";
import { RotateCcw } from "lucide-react";
import { calcFrequencyWindow, calcTau } from "@/lib/calculations";

interface SliderDef {
  key: keyof VentilatorParams;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  description: string;
  color: string;
  /** Tekst in plaats van de waarde als die 0 is (bijv. "passief") */
  zeroLabel?: string;
}

const SLIDER_GROUPS: { title: string; sliders: SliderDef[] }[] = [
  {
    title: "Ventilator",
    sliders: [
      {
        key: "peep",
        label: "PEEP",
        unit: "cmH₂O",
        min: 0, max: 20, step: 0.5,
        description: "Ingestelde PEEP; auto-PEEP volgt uit τ en de expiratietijd",
        color: "#0ea5e9",
      },
      {
        key: "pLimit",
        label: "Druk limiet",
        unit: "cmH₂O",
        min: 15, max: 50, step: 1,
        description: "Maximale inspiratiedruk (Pinsp)",
        color: "#ef4444",
      },
      {
        key: "pRamp",
        label: "P-ramp",
        unit: "ms",
        min: 0, max: 200, step: 10,
        description: "Drukstijgtijd aan het begin van de inspiratie (0 = ideale blokdruk)",
        color: "#c084fc",
      },
    ],
  },
  {
    title: "Longmechanica",
    sliders: [
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
    ],
  },
  {
    title: "Doel",
    sliders: [
      {
        key: "vaTarget",
        label: "V̇A Target",
        unit: "L/min",
        min: 2, max: 12, step: 0.25,
        description: "Gewenst alveolair minuutvolume",
        color: "#f472b6",
      },
    ],
  },
  {
    title: "Patiënt",
    sliders: [
      {
        key: "fSpont",
        label: "Eigen ademfrequentie",
        unit: "/min",
        min: 0, max: 45, step: 1,
        description: "Boven de doelfrequentie zijn alle teugen spontaan en houdt ASV het minuutvolume vast",
        color: "#38bdf8",
        zeroLabel: "passief",
      },
      {
        key: "peepiMeasured",
        label: "Gemeten PEEPi",
        unit: "cmH₂O",
        min: 0, max: 15, step: 0.5,
        description: "Expiratoire hold; boven de modelwaarde telt het als flowbeperking",
        color: "#f59e0b",
        zeroLabel: "niet gemeten",
      },
    ],
  },
];

const DOEL_OPTIES: { id: DoelModel; label: string; sub: string; title: string }[] = [
  { id: "otis", label: "Otis (1950)", sub: "minste arbeid · klassiek ASV", title: "Doel = frequentie met de minste ademarbeid per minuut" },
  { id: "mead", label: "Mead (1960)", sub: "minste kracht · richting ASV 1.1", title: "Doel = frequentie met de kleinste drukamplitude per teug" },
];

/** Voorbeeldpatiënten (70 kg IBW); zelfde waarden als de tabel op de theoriepagina. */
const PRESETS: { label: string; title: string; params: Partial<VentilatorParams> }[] = [
  {
    label: "Normaal",
    title: "Geventileerd, gezonde longen: C 60, R 8, PEEP 5",
    params: { peep: 5, pLimit: 30, resistance: 8, compliance: 60, ibw: 70, vaTarget: 5, fSpont: 0, peepiMeasured: 0 },
  },
  {
    label: "ARDS",
    title: "Restrictief: C 30, R 12, PEEP 10",
    params: { peep: 10, pLimit: 30, resistance: 12, compliance: 30, ibw: 70, vaTarget: 5, fSpont: 0, peepiMeasured: 0 },
  },
  {
    label: "COPD",
    title: "Obstructief: C 60, R 25, PEEP 5",
    params: { peep: 5, pLimit: 30, resistance: 25, compliance: 60, ibw: 70, vaTarget: 5, fSpont: 0, peepiMeasured: 0 },
  },
];

export default function ParameterPanel() {
  const { params, setParam, setParams, resetParams } = useVentStore();

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 sm:p-5 space-y-5">
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

      {/* Scenario's */}
      <div>
        <p className="text-xs text-gray-500 mb-2">Scenario</p>
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((preset) => {
            const active = (Object.keys(preset.params) as (keyof VentilatorParams)[])
              .every((k) => params[k] === preset.params[k]);
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => setParams(preset.params)}
                title={preset.title}
                className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                  active
                    ? "border-sky-500 bg-sky-950/50 text-sky-300"
                    : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Doelcriterium */}
      <div>
        <p className="text-xs text-gray-500 mb-2">Doelcriterium</p>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Doelcriterium">
          {DOEL_OPTIES.map((o) => {
            const active = (params.doelModel ?? "otis") === o.id;
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setParam("doelModel", o.id)}
                title={o.title}
                className={`rounded-lg border px-2 py-2 text-left text-xs transition-colors ${
                  active
                    ? o.id === "mead"
                      ? "border-fuchsia-500 bg-fuchsia-950/40 text-fuchsia-200"
                      : "border-yellow-500 bg-yellow-950/30 text-yellow-200"
                    : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500"
                }`}
              >
                <span className="block font-semibold">{o.label}</span>
                <span className="block text-[11px] text-gray-400">{o.sub}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-gray-500 leading-snug">
          ASV 1.1 weegt beide criteria mee; Hamilton publiceert de weging niet. Beide optima staan altijd in de grafiek.
        </p>
      </div>

      {/* Sliders */}
      {SLIDER_GROUPS.map((group) => (
        <div key={group.title} className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 border-t border-gray-800 pt-3">
            {group.title}
          </p>
          {group.sliders.map((s) => {
            const value = params[s.key] as number;
            const pct   = ((value - s.min) / (s.max - s.min)) * 100;

            return (
              <div key={String(s.key)} className="space-y-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-gray-200">{s.label}</span>
                  <span
                    className="text-sm font-mono font-bold whitespace-nowrap"
                    style={{ color: value === 0 && s.zeroLabel ? "#64748b" : s.color }}
                  >
                    {value === 0 && s.zeroLabel
                      ? s.zeroLabel
                      : `${value.toFixed(2).replace(/\.?0+$/, "")} ${s.unit}`}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-snug">{s.description}</p>
                <div className="relative pt-1">
                  <input
                    type="range"
                    min={s.min}
                    max={s.max}
                    step={s.step}
                    value={value}
                    onChange={(e) => setParam(s.key as keyof VentilatorParams, parseFloat(e.target.value))}
                    aria-label={s.label}
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
      ))}

      {/* Afgeleide grootheden */}
      <div className="border-t border-gray-700 pt-4 grid grid-cols-2 gap-3">
        <DerivedValue
          label="Tijdconstante τ = R·C"
          value={calcTau(params).toFixed(2)}
          unit="s"
          color="#94a3b8"
        />
        <DerivedValue
          label="ASV f-max = 20/τ"
          value={calcFrequencyWindow(params).fMaxBpm.toFixed(0)}
          unit="/min"
          color="#94a3b8"
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
