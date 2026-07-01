/**
 * iASV Berekeningsmodule — Otis & Mead formules
 *
 * Bronnen:
 *  - Otis AB et al. (1950) "The Mechanical Work of Breathing" J Appl Physiol
 *  - Mead J (1960) "Control of respiratory frequency" J Appl Physiol
 *  - Brunner JX & Laubscher TP (1993) — ASV algoritme (Hamilton Medical)
 *
 * Eenheden:
 *   Druk  → cmH₂O
 *   Volume → L
 *   Tijd  → s
 *   Flow  → L/s
 *   Werk  → J  (1 cmH₂O·L = 0.0980665 J)
 */

import type {
  VentilatorParams,
  OtisResult,
  WOBResult,
  LungProtectionResult,
  iASVDecision,
  WorkspacePoint,
} from "./types";

// ─── Conversiefactoren ────────────────────────────────────────────────────────
const CMH2O_TO_JOULE = 0.0980665; // 1 cmH₂O·L → J

// ─── Hulpfuncties ─────────────────────────────────────────────────────────────

/** Compliance C = τ / R  (L/cmH₂O) */
export function calcCompliance(params: VentilatorParams): number {
  return params.rcExp / params.resistance;
}

/**
 * Dead space op basis van Fowler (≈ 2.2 mL/kg IBW)
 * plus instrumentele dead space (geschat 50 mL voor volwassen circuit)
 */
export function calcDeadSpace(params: VentilatorParams): number {
  return params.ibw * 0.0022 + 0.05; // L
}

// ─── Otis-formule ─────────────────────────────────────────────────────────────

/**
 * Exacte Otis-kwadratische vergelijking voor de optimale ademfrequentie
 * die de totale WOB/min minimaliseert bij constante V̇A.
 *
 *   2π²τ · f² + f − V̇A/VD = 0
 *
 * Positieve wortel (Hz → bpm):
 *   f_opt = [−1 + √(1 + 8π²τ · V̇A/VD)] / (4π²τ)
 */
export function calcOtis(params: VentilatorParams): OtisResult {
  const C = calcCompliance(params);
  const vd = calcDeadSpace(params);
  const tau = params.rcExp;
  const VA_s = params.vaTarget / 60; // L/s

  const discriminant = 1 + 8 * Math.PI ** 2 * tau * (VA_s / vd);
  const fHz = (-1 + Math.sqrt(Math.max(discriminant, 0))) / (4 * Math.PI ** 2 * tau);
  const fBpm = fHz * 60;
  const vtOpt = VA_s / fHz + vd; // VT = V̇A/f + VD

  return { fOptHz: fHz, fOptBpm: fBpm, vtOpt, vd, compliance: C, tau };
}

// ─── WOB-berekening (Otis/Mead sinusoïdaal profiel) ──────────────────────────

/**
 * Werk van ademen voor één adem bij sinusoïdaal flowprofiel:
 *
 *   W_el    = VT² / (2C)                   [cmH₂O·L]
 *   W_res   = π²·R·f·VT² / 2               [cmH₂O·L]
 *   W_iPEEP = PEEPi · VT                   [cmH₂O·L]
 *
 * Alles × 0.098 → Joule
 */
export function calcWOB(
  params: VentilatorParams,
  fHz: number,
  vt: number
): WOBResult {
  const C = calcCompliance(params);

  const elastic   = (vt ** 2 / (2 * C))                     * CMH2O_TO_JOULE;
  const resistive = (Math.PI ** 2 * params.resistance * fHz * vt ** 2) / 2 * CMH2O_TO_JOULE;
  const intrinsic = params.autoPeep * vt                    * CMH2O_TO_JOULE;

  const perBreath  = elastic + resistive + intrinsic;
  const perMinute  = perBreath * fHz * 60;

  return { elastic, resistive, intrinsic, perBreath, perMinute };
}

// ─── Longbescherming ──────────────────────────────────────────────────────────

export function calcLungProtection(
  params: VentilatorParams,
  fHz: number,
  vt: number
): LungProtectionResult {
  const C          = calcCompliance(params);
  const totalPeep  = params.peep + params.autoPeep;
  const peakFlow   = Math.PI * fHz * vt;          // sinusoïdaal piekflow (L/s)

  const drivingPressure = vt / C;
  const peakPressure    = totalPeep + drivingPressure + params.resistance * peakFlow;
  const platPressure    = totalPeep + drivingPressure;
  const vtPerKg         = (vt * 1000) / params.ibw;

  // Mechanisch vermogen (Gattinoni 2016)
  const mechPower = 0.098 * fHz * 60 * vt * (peakPressure - params.peep / 2);

  return { drivingPressure, peakPressure, platPressure, vtPerKg, mechPower, totalPeep };
}

// ─── iASV beslissingsalgoritme ────────────────────────────────────────────────

/**
 * Simuleert het Hamilton iASV algoritme:
 *  1. Bereken het Otis-optimum (f, VT)
 *  2. Test alle veiligheidslimieten
 *  3. Selecteer het maximale veilige VT, pas f aan om V̇A te behouden
 *  4. Rapporteer welke limiet actief is
 */
export function calcIASV(params: VentilatorParams): iASVDecision {
  const otis       = calcOtis(params);
  const C          = otis.compliance;
  const vd         = otis.vd;
  const VA_s       = params.vaTarget / 60;
  const fOtisHz    = otis.fOptHz;
  const totalPeep  = params.peep + params.autoPeep;

  // ── Maximaal VT op basis van elke limiet ──────────────────────────────────
  // 1. Druk limiet: Ppeak = PEEP_tot + VT/C + R·π·f·VT  ≤ Plimit
  //    VT(f) ≤ (Plimit − PEEP_tot) / (1/C + R·π·f)
  const vtMaxPressure = (params.pLimit - totalPeep) /
    (1 / C + params.resistance * Math.PI * fOtisHz);

  // 2. Driving pressure: VT/C ≤ 15 cmH₂O
  const vtMaxDriving  = 15 * C;

  // 3. VT/kg ≤ 8 mL/kg
  const vtMaxKg       = (params.ibw * 8) / 1000;

  // 4. Plateaudruk ≤ 30 cmH₂O: totalPeep + VT/C ≤ 30
  const vtMaxPlat     = (30 - totalPeep) * C;

  const vtCeiling = Math.max(
    0.05,
    Math.min(vtMaxPressure, vtMaxDriving, vtMaxKg, vtMaxPlat)
  );

  const vtActual     = Math.min(otis.vtOpt, vtCeiling);
  const constrained  = vtActual < otis.vtOpt - 0.001;

  // Compenseer f om V̇A te behouden
  const fActualHz    = constrained
    ? VA_s / Math.max(vtActual - vd, 0.02)
    : fOtisHz;

  // Welke limiet is actief?
  let limitingFactor = "Geen — Otis-optimum";
  if (constrained) {
    const diffs = [
      { label: "Druk limiet (Ppeak)", v: vtMaxPressure },
      { label: "Driving pressure (ΔP ≤ 15)", v: vtMaxDriving },
      { label: "VT/kg-grens (8 mL/kg)", v: vtMaxKg },
      { label: "Plateaudruk (≤ 30 cmH₂O)", v: vtMaxPlat },
    ];
    limitingFactor = diffs.reduce((a, b) => (a.v < b.v ? a : b)).label;
  }

  // ── Scores ────────────────────────────────────────────────────────────────
  const prot       = calcLungProtection(params, fActualHz, vtActual);
  const wobActual  = calcWOB(params, fActualHz, vtActual);
  const wobOtis    = calcWOB(params, fOtisHz, otis.vtOpt);

  // WOB-score: hoe dicht bij het theoretische minimum?
  const wobScore = Math.max(0, Math.min(100,
    100 - ((wobActual.perMinute - wobOtis.perMinute) / Math.max(wobOtis.perMinute, 0.001)) * 100
  ));

  // Longbescherming-score: penaliseer overschrijding limieten
  let protScore = 100;
  if (prot.drivingPressure > 15) protScore -= (prot.drivingPressure - 15) * 5;
  if (prot.peakPressure > params.pLimit) protScore -= (prot.peakPressure - params.pLimit) * 5;
  if (prot.vtPerKg > 8) protScore -= (prot.vtPerKg - 8) * 10;
  if (prot.mechPower > 17) protScore -= (prot.mechPower - 17) * 2;
  protScore = Math.max(0, Math.min(100, protScore));

  return {
    fOtis:           otis.fOptBpm,
    vtOtis:          otis.vtOpt,
    fActual:         fActualHz * 60,
    vtActual,
    constrained,
    limitingFactor,
    protectionScore: protScore,
    wobScore,
  };
}

// ─── Workspace-raster voor contourplot ───────────────────────────────────────

/**
 * Genereert een raster van (f, VT, WOB) punten voor de Otis-workspace contourplot.
 * f: 4–40 bpm, VT: 0.2–1.5 L
 */
export function generateWorkspace(params: VentilatorParams): WorkspacePoint[] {
  const points: WorkspacePoint[] = [];
  const fSteps  = 37; // 4..40 bpm
  const vtSteps = 27; // 0.2..1.5 L

  for (let fi = 0; fi <= fSteps; fi++) {
    const fBpm = 4 + fi * 1;
    const fHz  = fBpm / 60;
    for (let vi = 0; vi <= vtSteps; vi++) {
      const vt  = 0.2 + vi * 0.05;
      const wob = calcWOB(params, fHz, vt).perMinute;
      points.push({ f: fBpm, vt, wob });
    }
  }
  return points;
}

/** VT op de V̇A-hyperbool bij gegeven f (bpm). */
export function calcVtHyperbolaAtF(params: VentilatorParams, fBpm: number): number {
  const vd = calcDeadSpace(params);
  const VA_s = params.vaTarget / 60;
  return VA_s / (fBpm / 60) + vd;
}

/** VT op de druk-limietlijn bij gegeven f (bpm). */
export function calcVtPressureLimitAtF(params: VentilatorParams, fBpm: number): number {
  const C = calcCompliance(params);
  const totalPeep = params.peep + params.autoPeep;
  const fHz = fBpm / 60;
  return (params.pLimit - totalPeep) / (1 / C + params.resistance * Math.PI * fHz);
}

/**
 * Genereert de ventilatiehyperbool (VT = V̇A/f + VD) voor f = 4..40 bpm.
 */
export function generateVentilationHyperbola(
  params: VentilatorParams
): { f: number; vt: number }[] {
  const vd   = calcDeadSpace(params);
  const VA_s = params.vaTarget / 60;
  const result = [];
  for (let fBpm = 4; fBpm <= 40; fBpm += 0.5) {
    const fHz = fBpm / 60;
    const vt  = VA_s / fHz + vd;
    if (vt > 0.15 && vt < 2.0) result.push({ f: fBpm, vt });
  }
  return result;
}

/**
 * Genereert de druk-limietlijn in het (f, VT)-vlak.
 * VT_max(f) = (Plimit − PEEP_tot) / (1/C + R·π·f)
 */
export function generatePressureLimitLine(
  params: VentilatorParams
): { f: number; vt: number }[] {
  const C        = calcCompliance(params);
  const totalPeep = params.peep + params.autoPeep;
  const result   = [];
  for (let fBpm = 4; fBpm <= 40; fBpm += 0.5) {
    const fHz = fBpm / 60;
    const vt  = (params.pLimit - totalPeep) /
                (1 / C + params.resistance * Math.PI * fHz);
    if (vt > 0.1) result.push({ f: fBpm, vt });
  }
  return result;
}

/**
 * Genereert punten voor de gesimuleerde PV-lus
 */
export function generatePVLoop(
  params: VentilatorParams,
  fHz: number,
  vt: number
): { p: number; v: number }[] {
  const C        = calcCompliance(params);
  const totalPeep = params.peep + params.autoPeep;
  const steps    = 80;
  const result   = [];

  // Inspiratie (0 → VT), sinusoïdaal
  for (let i = 0; i <= steps; i++) {
    const t   = i / steps; // 0..1
    const v   = vt * (1 - Math.cos(Math.PI * t)) / 2; // 0 → VT
    const flow = Math.PI * fHz * vt * Math.sin(Math.PI * t); // sinusoïdaal
    const p   = totalPeep + v / C + params.resistance * flow;
    result.push({ p, v: v * 1000 }); // v in mL
  }
  // Expiratie (VT → 0)
  for (let i = steps; i >= 0; i--) {
    const t    = i / steps;
    const v    = vt * (1 - Math.cos(Math.PI * t)) / 2;
    const flow = -Math.PI * fHz * vt * Math.sin(Math.PI * t) * 0.7; // passieve expiratie
    const p    = totalPeep + v / C + params.resistance * flow;
    result.push({ p, v: v * 1000 });
  }
  return result;
}

/**
 * Genereert flow-tijd en druk-tijd curven voor één ademcyclus
 */
export function generateTimeCurves(
  params: VentilatorParams,
  fHz: number,
  vt: number
): { t: number; flow: number; pressure: number; volume: number }[] {
  const C         = calcCompliance(params);
  const totalPeep = params.peep + params.autoPeep;
  const T         = 1 / fHz; // periode (s)
  const steps     = 100;
  const result    = [];

  for (let i = 0; i <= steps; i++) {
    const frac  = i / steps;
    const t     = frac * T;
    const phase = frac * 2 * Math.PI;
    const peakFlow = Math.PI * fHz * vt;

    // Inspiratie 0..π, Expiratie π..2π
    const flow = frac < 0.5
      ? peakFlow * Math.sin(phase)
      : (() => {
          const u = (frac - 0.5) * 2; // 0..1 in expiratie
          const smoothstep = u * u * (3 - 2 * u);
          const expScale = 1 - 0.3 * smoothstep; // 1.0 -> 0.7
          return -peakFlow * expScale * Math.sin(Math.PI * u);
        })();

    // Keep volume continuous at the insp→exp transition to avoid a visible kink.
    const volume = frac < 0.5
      ? vt * (1 - Math.cos(phase)) / 2
      : vt * (1 + Math.cos(phase - Math.PI)) / 2;

    const pressure = totalPeep + Math.max(volume, 0) / C + params.resistance * flow;

    result.push({ t, flow, pressure, volume: volume * 1000 }); // volume in mL
  }
  return result;
}
