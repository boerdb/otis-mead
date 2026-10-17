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
  ReferenceLine,
} from "recharts";
import { useVentStore } from "@/store/ventStore";
import {
  calcBreath,
  calcIASV,
  calcTau,
  generatePVLoop,
  generateTimeCurves,
} from "@/lib/calculations";
import { chartTooltipContentStyle } from "@/components/chartTooltipStyles";

const GRID = "#1e293b";
const TICK = { fill: "#64748b", fontSize: 10 };
const AXIS_LABEL = { fill: "#94a3b8", fontSize: 10 };
const PANEL_MARGIN = { top: 6, right: 12, left: 0, bottom: 0 };

const C_PAW  = "#f472b6";
const C_PALV = "#fbbf24";
const C_FLOW = "#34d399";
const C_VOL  = "#38bdf8";

export default function PVAndTimeCurves() {
  const params = useVentStore((s) => s.params);
  const iasv   = useMemo(() => calcIASV(params), [params]);

  // Curven tonen de gemeten teug (bij spontane ademhaling wijkt die af van het doel)
  const fHz = iasv.measured.fBpm / 60;
  const vt  = iasv.measured.vt;

  const breath     = useMemo(() => calcBreath(params, fHz, vt), [params, fHz, vt]);
  const pv         = useMemo(() => generatePVLoop(params, fHz, vt), [params, fHz, vt]);
  const timeCurves = useMemo(() => generateTimeCurves(params, fHz, vt), [params, fHz, vt]);

  const period    = 1 / fHz;
  const tMax      = 2 * period;
  const pMax      = Math.ceil(Math.max(params.pLimit, breath.pinsp) / 5) * 5 + 5;
  const pTicks    = Array.from({ length: Math.floor(pMax / (pMax > 40 ? 10 : 5)) + 1 }, (_, i) => i * (pMax > 40 ? 10 : 5));
  const flowAbs   = Math.max(...timeCurves.map((p) => Math.abs(p.flow)));
  const flowMax   = Math.ceil(flowAbs / 10) * 10;
  const volMax    = Math.ceil((vt * 1000 * 1.15) / 100) * 100;
  const hasAutoPeep = breath.autoPeep >= 0.5;

  const tooltip = (
    <Tooltip
      contentStyle={chartTooltipContentStyle}
      labelFormatter={(label) => `${typeof label === "number" ? label.toFixed(2) : label} s`}
      formatter={(val: unknown, name: unknown) => [
        typeof val === "number" ? val.toFixed(1) : "—",
        String(name ?? ""),
      ]}
    />
  );

  return (
    <div className="space-y-5">
      {/* Tijdcurven */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
            Ademteug — druk · flow · volume
          </h2>
          <p className="text-xs text-gray-500">
            Drukgecontroleerd zoals ASV · I:E 1:2 · P-ramp {params.pRamp} ms · passieve expiratie · 2 cycli
          </p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
          <Stat label="Pinsp" value={breath.pinsp.toFixed(1)} unit="cmH₂O" color={C_PAW} />
          <Stat label="PEEP" value={params.peep.toFixed(1)} unit="cmH₂O" />
          <Stat
            label={breath.flowLimitedPeep > 0 ? "PEEPi (gemeten)" : "PEEPi (model)"}
            value={breath.autoPeep.toFixed(1)}
            unit="cmH₂O"
            color={hasAutoPeep ? "#f59e0b" : undefined}
          />
          <Stat label="Ti" value={breath.ti.toFixed(2)} unit="s" />
          <Stat label="Te" value={breath.te.toFixed(2)} unit="s" />
          <Stat label="Te / τ" value={(breath.te / calcTau(params)).toFixed(1)} unit="" />
        </div>

        <div className="space-y-1">
          <ChartLabel color={C_PAW} text="Druk (cmH₂O)" extra={<><Swatch color={C_PALV} dashed /> alveolair</>} />
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={timeCurves} syncId="breath" margin={PANEL_MARGIN}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis dataKey="t" type="number" domain={[0, tMax]} hide />
              <YAxis domain={[0, pMax]} ticks={pTicks} tick={TICK} width={36} />
              <ReferenceLine y={params.pLimit} stroke="#ef4444" strokeDasharray="4 3"
                label={{ value: "P limiet", fill: "#ef4444", fontSize: 9, position: "insideTopRight" }} />
              <ReferenceLine y={params.peep} stroke="#475569" strokeDasharray="2 3" />
              {tooltip}
              <Line dataKey="paw" name="Paw" stroke={C_PAW} strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line dataKey="palv" name="Palv" stroke={C_PALV} strokeWidth={1.5} strokeDasharray="4 3" dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>

          <ChartLabel color={C_FLOW} text="Flow (L/min)" />
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={timeCurves} syncId="breath" margin={PANEL_MARGIN}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis dataKey="t" type="number" domain={[0, tMax]} hide />
              <YAxis domain={[-flowMax, flowMax]} tick={TICK} width={36} tickFormatter={(v: number) => v.toFixed(0)} />
              <ReferenceLine y={0} stroke="#475569" />
              {tooltip}
              <Line dataKey="flow" name="Flow" stroke={C_FLOW} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>

          <ChartLabel color={C_VOL} text="Volume (mL)" />
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={timeCurves} syncId="breath" margin={{ ...PANEL_MARGIN, bottom: 18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis
                dataKey="t"
                type="number"
                domain={[0, tMax]}
                tickFormatter={(v: number) => v.toFixed(1)}
                tick={TICK}
                label={{ ...AXIS_LABEL, value: "Tijd (s)", position: "insideBottomRight", offset: -12 }}
              />
              <YAxis domain={[0, volMax]} tick={TICK} width={36} tickFormatter={(v: number) => v.toFixed(0)} />
              {tooltip}
              <Line dataKey="volume" name="Volume" stroke={C_VOL} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {iasv.measured.spontaneous && (
          <p className="mt-3 text-xs leading-relaxed text-sky-300">
            Gemeten teug bij eigen ademfrequentie {iasv.measured.fBpm.toFixed(0)}/min. Het model toont de passieve mechanica bij deze f en VT; de inspanning van de patiënt (Pmus) is niet gemodelleerd.
          </p>
        )}
        <p className={`mt-3 text-xs leading-relaxed ${hasAutoPeep ? "text-amber-300" : "text-gray-500"}`}>
          {breath.autoPeepModel >= 0.5
            ? `De expiratieflow keert niet terug naar nul voordat de volgende teug start: ${(breath.trappedVolume * 1000).toFixed(0)} mL blijft achter (dynamische auto-PEEP ${breath.autoPeepModel.toFixed(1)} cmH₂O). Een lagere frequentie of een langere Te verhelpt dit.`
            : "De expiratieflow bereikt vrijwel nul voor de volgende teug: geen relevante dynamische auto-PEEP."}
          {breath.flowLimitedPeep > 0 &&
            ` De gemeten PEEPi (${params.peepiMeasured.toFixed(1)} cmH₂O) is ${breath.flowLimitedPeep.toFixed(1)} cmH₂O hoger dan het model voorspelt; dat deel wordt toegeschreven aan expiratoire flowbeperking en verhoogt de alveolaire basisdruk, Pplat en de benodigde Pinsp. De flowcurve zelf toont die flowbeperking niet.`}
        </p>
      </div>

      {/* PV-lus */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
            Druk-volumelus
          </h2>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><Swatch color={C_PAW} /> Paw (luchtweg)</span>
            <span className="flex items-center gap-1.5"><Swatch color={C_PALV} dashed /> Palv = PEEP_tot + V/C</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart margin={{ top: 8, right: 16, left: 0, bottom: 18 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis
              dataKey="p"
              type="number"
              domain={[0, pMax]}
              ticks={pTicks}
              tick={TICK}
              label={{ ...AXIS_LABEL, value: "Druk (cmH₂O)", position: "insideBottomRight", offset: -12 }}
            />
            <YAxis dataKey="v" type="number" domain={[0, volMax]} tick={TICK} width={40} tickFormatter={(v: number) => v.toFixed(0)} />
            <ReferenceLine x={params.pLimit} stroke="#ef4444" strokeDasharray="4 3"
              label={{ value: "P limiet", fill: "#ef4444", fontSize: 9, position: "insideTopLeft" }} />
            <Line data={pv.loop} dataKey="v" name="Paw" stroke={C_PAW} strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line data={pv.alveolar} dataKey="v" name="Palv" stroke={C_PALV} strokeWidth={1.5} strokeDasharray="4 3" dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
        <p className="mt-2 text-xs text-gray-500 leading-relaxed">
          De afgeronde hoeken komen van de drukstijgtijd (P-ramp) en van de drukafname bij het openen van de expiratieklep. Het oppervlak links van de Palv-lijn (boven PEEP) is de elastische energie, het oppervlak tussen Palv en de inspiratietak van Paw de resistieve energie; samen met de PEEP-term vormt dit het mechanisch vermogen per teug. Zet P-ramp op 0 voor de ideale blokdruk.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, unit, color }: { label: string; value: string; unit: string; color?: string }) {
  return (
    <div className="bg-gray-800 rounded-lg px-2.5 py-2 min-w-0">
      <p className="text-[11px] text-gray-500 truncate">{label}</p>
      <p className="text-sm font-mono font-semibold truncate" style={{ color: color ?? "#e2e8f0" }}>
        {value}
        {unit && <span className="text-[10px] text-gray-500 ml-1">{unit}</span>}
      </p>
    </div>
  );
}

function Swatch({ color, dashed = false }: { color: string; dashed?: boolean }) {
  return (
    <span
      className="inline-block w-4 align-middle"
      style={{ borderTop: `2px ${dashed ? "dashed" : "solid"} ${color}` }}
    />
  );
}

function ChartLabel({ color, text, extra }: { color: string; text: string; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-xs pl-9">
      <span className="flex items-center gap-1.5" style={{ color }}>
        <Swatch color={color} /> {text}
      </span>
      {extra && <span className="flex items-center gap-1.5 text-gray-400">{extra}</span>}
    </div>
  );
}
