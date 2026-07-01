"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
  Legend,
} from "recharts";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Coordinate } from "recharts";
import { useVentStore } from "@/store/ventStore";
import {
  calcOtis,
  calcIASV,
  generateVentilationHyperbola,
  generatePressureLimitLine,
  calcCompliance,
  calcVtHyperbolaAtF,
  calcVtPressureLimitAtF,
} from "@/lib/calculations";
import type { VentilatorParams } from "@/lib/types";
import {
  chartTooltipContentStyle,
  chartTooltipItemStyle,
  chartTooltipLabelStyle,
} from "@/components/chartTooltipStyles";

const F_MIN = 4;
const F_MAX = 40;
const CHART_MARGIN = { top: 15, right: 20, bottom: 30, left: 15 };

type DatasetRow = { f: number; vt_hyp?: number; vt_plimit?: number };

function buildDataset(
  hyperbola: { f: number; vt: number }[],
  pLimitLine: { f: number; vt: number }[]
): DatasetRow[] {
  const map = new Map<number, DatasetRow>();
  for (const p of hyperbola) {
    const key = +p.f.toFixed(1);
    map.set(key, { ...map.get(key), f: key, vt_hyp: p.vt });
  }
  for (const p of pLimitLine) {
    const key = +p.f.toFixed(1);
    map.set(key, { ...map.get(key), f: key, vt_plimit: p.vt });
  }
  return Array.from(map.values()).sort((a, b) => a.f - b.f);
}

/** Zet pixel-x (Recharts) om naar frequentie — omzeilt buggy tooltip label bij ComposedChart. */
function frequencyFromCoordinateX(x: number, chartWidth: number): number {
  const plotLeft = CHART_MARGIN.left;
  const plotWidth = chartWidth - CHART_MARGIN.left - CHART_MARGIN.right;
  if (plotWidth <= 0) return F_MIN;
  const ratio = (x - plotLeft) / plotWidth;
  const f = F_MIN + ratio * (F_MAX - F_MIN);
  return Math.max(F_MIN, Math.min(F_MAX, f));
}

function OtisChartTooltip({
  active,
  coordinate,
  chartWidth,
  params,
}: {
  active?: boolean;
  coordinate?: Coordinate;
  chartWidth: number;
  params: VentilatorParams;
}) {
  if (!active || !coordinate || chartWidth <= 0) return null;

  const f = frequencyFromCoordinateX(coordinate.x, chartWidth);
  const vtHyp = calcVtHyperbolaAtF(params, f);
  const vtPlimit = calcVtPressureLimitAtF(params, f);

  const entries = [
    { name: "Druk limiet (Ppeak)", value: vtPlimit, color: "#ef4444" },
    { name: "V̇A hyperbool", value: vtHyp, color: "#22d3ee" },
  ];

  return (
    <div className="recharts-default-tooltip" style={chartTooltipContentStyle}>
      <p className="recharts-tooltip-label" style={chartTooltipLabelStyle}>
        {f.toFixed(1)} bpm
      </p>
      <ul className="recharts-tooltip-item-list" style={{ padding: 0, margin: 0 }}>
        {entries.map(({ name, value, color }) => (
          <li
            key={name}
            className="recharts-tooltip-item"
            style={chartTooltipItemStyle(color)}
          >
            <span className="recharts-tooltip-item-name">{name}</span>
            <span className="recharts-tooltip-item-separator"> : </span>
            <span className="recharts-tooltip-item-value">{value.toFixed(3)}</span>
            <span className="recharts-tooltip-item-unit"> L</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function OtisWorkspace() {
  const params = useVentStore((s) => s.params);
  const chartWrapRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);

  const otis       = useMemo(() => calcOtis(params), [params]);
  const iasv       = useMemo(() => calcIASV(params), [params]);
  const hyperbola  = useMemo(() => generateVentilationHyperbola(params), [params]);
  const pLimitLine = useMemo(() => generatePressureLimitLine(params), [params]);
  const C          = useMemo(() => calcCompliance(params), [params]);

  const dataset = useMemo(
    () => buildDataset(hyperbola, pLimitLine),
    [hyperbola, pLimitLine]
  );

  const vtKg8       = (params.ibw * 8) / 1000;
  const vtKg6       = (params.ibw * 6) / 1000;
  const vtDriving15 = 15 * C;

  useEffect(() => {
    const el = chartWrapRef.current;
    if (!el) return;
    const update = () => setChartWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const renderTooltip = useCallback(
    (props: { active?: boolean; coordinate?: Coordinate }) => (
      <OtisChartTooltip
        active={props.active}
        coordinate={props.coordinate}
        chartWidth={chartWidth}
        params={params}
      />
    ),
    [chartWidth, params]
  );

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
      <div className="mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
          Otis Workspace — f · V<sub>T</sub> vlak
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          V̇A-hyperbool (cyaan) · Druklimieten (rood) · ★ Otis-optimum (geel) · ● iASV werkpunt (groen)
        </p>
      </div>

      <div ref={chartWrapRef}>
        <ResponsiveContainer width="100%" height={380}>
          <LineChart
            data={dataset}
            margin={CHART_MARGIN}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="f"
              type="number"
              domain={[F_MIN, F_MAX]}
              tickCount={10}
              label={{ value: "Frequentie (bpm)", position: "insideBottomRight", offset: -5, fill: "#94a3b8", fontSize: 11 }}
              tick={{ fill: "#64748b", fontSize: 11 }}
            />
            <YAxis
              domain={[0.1, 1.6]}
              tickFormatter={(v: number) => v.toFixed(2)}
              label={{ value: "VT (L)", angle: -90, position: "insideLeft", fill: "#94a3b8", fontSize: 11 }}
              tick={{ fill: "#64748b", fontSize: 11 }}
            />
            <Tooltip
              shared
              cursor={{ stroke: "#94a3b8", strokeWidth: 1 }}
              content={renderTooltip}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />

            <Line
              dataKey="vt_hyp"
              name="V̇A hyperbool"
              stroke="#22d3ee"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
            <Line
              dataKey="vt_plimit"
              name="Druk limiet (Ppeak)"
              stroke="#ef4444"
              strokeWidth={1.5}
              strokeDasharray="6 3"
              dot={false}
              isAnimationActive={false}
              connectNulls={false}
            />

            <ReferenceLine y={vtKg8} stroke="#f59e0b" strokeDasharray="5 4" strokeWidth={1.5}
              label={{ value: "8 mL/kg", fill: "#f59e0b", fontSize: 10, position: "insideTopRight" }} />
            <ReferenceLine y={vtKg6} stroke="#fbbf24" strokeDasharray="3 4" strokeWidth={1}
              label={{ value: "6 mL/kg", fill: "#fbbf24", fontSize: 9, position: "insideTopRight" }} />
            <ReferenceLine y={vtDriving15} stroke="#a78bfa" strokeDasharray="5 4" strokeWidth={1}
              label={{ value: "ΔP=15", fill: "#a78bfa", fontSize: 10, position: "insideTopLeft" }} />

            <ReferenceDot
              x={otis.fOptBpm}
              y={otis.vtOpt}
              r={7}
              fill="#facc15"
              stroke="#ca8a04"
              strokeWidth={1}
              ifOverflow="visible"
            />
            <ReferenceDot
              x={iasv.fActual}
              y={iasv.vtActual}
              r={6}
              fill="#4ade80"
              stroke="#16a34a"
              strokeWidth={1}
              ifOverflow="visible"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Samenvatting */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <SummaryBox
          label="★ Otis-optimum"
          color="yellow"
          items={[
            { k: "f",     v: `${otis.fOptBpm.toFixed(1)} bpm` },
            { k: "VT",    v: `${(otis.vtOpt * 1000).toFixed(0)} mL` },
            { k: "VT/kg", v: `${((otis.vtOpt * 1000) / params.ibw).toFixed(1)} mL/kg` },
            { k: "τ",     v: `${otis.tau.toFixed(2)} s` },
          ]}
        />
        <SummaryBox
          label="● iASV Werkpunt"
          color={iasv.constrained ? "orange" : "green"}
          items={[
            { k: "f",  v: `${iasv.fActual.toFixed(1)} bpm` },
            { k: "VT", v: `${(iasv.vtActual * 1000).toFixed(0)} mL` },
            iasv.constrained
              ? { k: "⚠", v: iasv.limitingFactor }
              : { k: "✓", v: "Otis-optimum veilig" },
          ]}
        />
      </div>
    </div>
  );
}

type Color = "yellow" | "green" | "orange";
const colorMap: Record<Color, string> = {
  yellow: "bg-yellow-950/40 border-yellow-800/40 text-yellow-400",
  green:  "bg-green-950/40 border-green-800/40 text-green-400",
  orange: "bg-orange-950/40 border-orange-800/40 text-orange-400",
};

function SummaryBox({ label, color, items }: { label: string; color: Color; items: { k: string; v: string }[] }) {
  return (
    <div className={`rounded-xl p-3 border ${colorMap[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-wider mb-2">{label}</p>
      <div className="grid grid-cols-2 gap-1">
        {items.map(({ k, v }) => (
          <div key={k}>
            <span className="text-gray-500 text-xs">{k}: </span>
            <span className="text-gray-200 font-mono text-xs">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
