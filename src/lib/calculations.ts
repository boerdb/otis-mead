/**
 * iASV Berekeningsmodule — Otis & Mead formules
 *
 * Bronnen:
 *  - Otis AB, Fenn WO, Rahn H (1950) "Mechanics of breathing in man" J Appl Physiol 2:592–607
 *  - Mead J (1960) "Control of respiratory frequency" J Appl Physiol 15:325–336
 *  - Laubscher TP et al. (1994) "An adaptive lung ventilation controller" IEEE Trans Biomed Eng 41:51–59
 *  - Radford EP (1955) — dode ruimte ≈ 2.2 mL/kg IBW (zoals gebruikt in ASV)
 *  - Gattinoni L et al. (2016) "Ventilator-related causes of lung injury: the mechanical power"
 *    Intensive Care Med 42:1567–1575
 *
 * Model: één-compartiment long (lineaire R en C) met sinusoïdaal flowprofiel,
 * inspiratie = eerste halve periode, expiratie passief (geen spierarbeid).
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
const PI2 = Math.PI ** 2;

// ─── Veiligheidsgrenzen ──────────────────────────────────────────────────────

/** Didactische longbeschermende grenzen (geen Hamilton-instellingen). */
export const LIMITS = {
  drivingPressure: 15, // cmH₂O
  platPressure:    30, // cmH₂O
  vtPerKg:         8,  // mL/kg IBW
  mechPower:       17, // J/min
} as const;

/** ASV-regels: f ≥ 5/min, f ≤ 60/min en f ≤ 20/τ (Ti ≥ 1τ, Te ≥ 2τ). */
export const ASV_F_MIN_BPM = 5;
export const ASV_F_MAX_BPM = 60;

// ─── Hulpfuncties ─────────────────────────────────────────────────────────────

/** Compliance C (L/cmH₂O) uit de invoer in mL/cmH₂O */
export function calcCompliance(params: VentilatorParams): number {
  return params.compliance / 1000;
}

/** Tijdconstante τ = R·C (s) */
export function calcTau(params: VentilatorParams): number {
  return params.resistance * calcCompliance(params);
}

/** Dode ruimte VD = 2.2 mL/kg IBW (Radford; ASV-conventie) */
export function calcDeadSpace(params: VentilatorParams): number {
  return params.ibw * 0.0022; // L
}

// ─── Otis-formule ─────────────────────────────────────────────────────────────

/**
 * Otis-vergelijking voor de frequentie die de inspiratoire arbeid per minuut
 * minimaliseert bij constante V̇A (sinusoïdale flow, a = 2π²):
 *
 *   π²τ · f² + f − V̇A/VD = 0
 *
 * Positieve wortel (Hz):
 *   f_opt = [√(1 + 2a·τ·V̇A/VD) − 1] / (a·τ)
 */
export function calcOtis(params: VentilatorParams): OtisResult {
  const C = calcCompliance(params);
  const vd = calcDeadSpace(params);
  const tau = calcTau(params);
  const VA_s = params.vaTarget / 60; // L/s
  const a = 2 * PI2;

  const fHz = (Math.sqrt(1 + 2 * a * tau * (VA_s / vd)) - 1) / (a * tau);
  const fBpm = fHz * 60;
  const vtOpt = VA_s / fHz + vd; // VT = V̇A/f + VD

  return { fOptHz: fHz, fOptBpm: fBpm, vtOpt, vd, compliance: C, tau };
}

// ─── WOB-berekening (Otis sinusoïdaal profiel) ───────────────────────────────

/**
 * Inspiratoire arbeid voor één adem bij sinusoïdaal flowprofiel:
 *
 *   W_el    = VT² / (2C)                   [cmH₂O·L]
 *   W_res   = π²·R·f·VT² / 4               [cmH₂O·L]  (alleen inspiratie)
 *   W_iPEEP = PEEPi · VT                   [cmH₂O·L]
 *
 * Expiratie is passief en telt niet mee. Alles × 0.098 → Joule.
 */
export function calcWOB(
  params: VentilatorParams,
  fHz: number,
  vt: number
): WOBResult {
  const C = calcCompliance(params);

  const elastic   = (vt ** 2 / (2 * C))                  * CMH2O_TO_JOULE;
  const resistive = (PI2 * params.resistance * fHz * vt ** 2) / 4 * CMH2O_TO_JOULE;
  const intrinsic = params.autoPeep * vt                 * CMH2O_TO_JOULE;

  const perBreath  = elastic + resistive + intrinsic;
  const perMinute  = perBreath * fHz * 60;

  return { elastic, resistive, intrinsic, perBreath, perMinute };
}

// ─── Longbescherming ──────────────────────────────────────────────────────────

/**
 * Piekdruk boven PEEP_tot per liter VT bij sinusoïdale inspiratie.
 *
 *   P(θ) − PEEP_tot = VT/(2C)·(1 − cos θ) + R·π·f·VT·sin θ,  θ ∈ [0, π]
 *   max = VT · [1/(2C) + √(1/(4C²) + (R·π·f)²)]
 *
 * Elastische en resistieve piek vallen niet samen, dus dit is lager dan
 * VT/C + R·π·f·VT.
 */
function peakPressurePerLitre(C: number, R: number, fHz: number): number {
  const e = 1 / (2 * C);
  const r = R * Math.PI * fHz;
  return e + Math.sqrt(e * e + r * r);
}

export function calcLungProtection(
  params: VentilatorParams,
  fHz: number,
  vt: number
): LungProtectionResult {
  const C          = calcCompliance(params);
  const totalPeep  = params.peep + params.autoPeep;

  const drivingPressure = vt / C;
  const peakPressure    = totalPeep + vt * peakPressurePerLitre(C, params.resistance, fHz);
  const platPressure    = totalPeep + drivingPressure;
  const vtPerKg         = (vt * 1000) / params.ibw;

  // Mechanisch vermogen (Gattinoni 2016, volledige vergelijking) toegepast op
  // het sinusoïdale profiel: energie per inspiratie = ∫P dV
  //   = VT²/(2C) + π²·R·f·VT²/4 + PEEP_tot·VT
  const energyPerBreath =
    vt ** 2 / (2 * C) + (PI2 * params.resistance * fHz * vt ** 2) / 4 + totalPeep * vt;
  const mechPower = CMH2O_TO_JOULE * fHz * 60 * energyPerBreath;

  return { drivingPressure, peakPressure, platPressure, vtPerKg, mechPower, totalPeep };
}

// ─── iASV beslissingsalgoritme ────────────────────────────────────────────────

interface Constraint {
  label: string;
  ok: (fBpm: number, vt: number) => boolean;
}

/** Frequentievenster volgens de ASV-regels (bpm). */
export function calcFrequencyWindow(params: VentilatorParams): { fMinBpm: number; fMaxBpm: number } {
  return {
    fMinBpm: ASV_F_MIN_BPM,
    fMaxBpm: Math.min(ASV_F_MAX_BPM, 20 / calcTau(params)),
  };
}

function buildConstraints(params: VentilatorParams): Constraint[] {
  const C         = calcCompliance(params);
  const vd        = calcDeadSpace(params);
  const totalPeep = params.peep + params.autoPeep;
  const { fMinBpm, fMaxBpm } = calcFrequencyWindow(params);
  const eps = 1e-9;

  return [
    { label: `Minimale frequentie (${ASV_F_MIN_BPM}/min)`, ok: (f) => f >= fMinBpm - eps },
    { label: "Maximale frequentie (20/τ — auto-PEEP-preventie)", ok: (f) => f <= fMaxBpm + eps },
    { label: "Minimaal VT (2 × VD)", ok: (_, vt) => vt >= 2 * vd - eps },
    {
      label: "Druk limiet (Ppeak)",
      ok: (f, vt) =>
        totalPeep + vt * peakPressurePerLitre(C, params.resistance, f / 60) <= params.pLimit + eps,
    },
    {
      label: `Driving pressure (ΔP ≤ ${LIMITS.drivingPressure})`,
      ok: (_, vt) => vt / C <= LIMITS.drivingPressure + eps,
    },
    {
      label: `Plateaudruk (≤ ${LIMITS.platPressure} cmH₂O)`,
      ok: (_, vt) => totalPeep + vt / C <= LIMITS.platPressure + eps,
    },
    {
      label: `VT/kg-grens (${LIMITS.vtPerKg} mL/kg)`,
      ok: (_, vt) => (vt * 1000) / params.ibw <= LIMITS.vtPerKg + eps,
    },
  ];
}

/**
 * Simuleert de iASV-keuze in het Otis-model:
 *  1. Bereken het Otis-optimum (f, VT) op de V̇A-hyperbool
 *  2. Bepaal welke punten op de hyperbool aan alle limieten voldoen
 *  3. Kies het toegestane punt met f het dichtst bij f_Otis (V̇A blijft gelijk)
 *  4. Rapporteer welke limiet de verschuiving veroorzaakt
 *
 * Langs de hyperbool hangen alle limieten van f af (Ppeak via VT én f), dus
 * de grens wordt gezamenlijk opgelost in plaats van alleen VT af te kappen.
 */
export function calcIASV(params: VentilatorParams): iASVDecision {
  const otis      = calcOtis(params);
  const vd        = otis.vd;
  const VA_s      = params.vaTarget / 60;
  const { fMinBpm, fMaxBpm } = calcFrequencyWindow(params);
  const constraints = buildConstraints(params);

  const vtAt = (fBpm: number) => VA_s / (fBpm / 60) + vd;
  const failing = (fBpm: number) =>
    constraints.filter((c) => !c.ok(fBpm, vtAt(fBpm))).map((c) => c.label);
  const feasibleAt = (fBpm: number) => failing(fBpm).length === 0;

  const fOtis = otis.fOptBpm;
  let fChosen = fOtis;
  let feasible = true;
  let limitingFactor = "Geen — Otis-optimum";

  if (!feasibleAt(fOtis)) {
    // Fijn raster binnen het ASV-frequentievenster, daarna bisectie op de grens.
    const step = 0.01;
    let best: number | null = null;
    for (let f = fMinBpm; f <= fMaxBpm + 1e-9; f += step) {
      if (feasibleAt(f) && (best === null || Math.abs(f - fOtis) < Math.abs(best - fOtis))) {
        best = f;
      }
    }

    if (best === null) {
      feasible = false;
      fChosen = Math.min(fMaxBpm, Math.max(fMinBpm, fOtis));
      limitingFactor = `Geen veilig werkpunt: ${failing(fChosen).join(", ")}`;
    } else {
      // Bisectie tussen het laatste toegestane punt en het eerste verboden punt richting f_Otis.
      const dir = Math.sign(fOtis - best);
      let lo = best;
      let hi = Math.abs(fOtis - best) < step ? fOtis : best + dir * step;
      for (let i = 0; i < 40; i++) {
        const mid = (lo + hi) / 2;
        if (feasibleAt(mid)) lo = mid; else hi = mid;
      }
      fChosen = lo;
      limitingFactor = failing(hi).join(", ");
    }
  }

  const fActualHz = fChosen / 60;
  const vtActual  = vtAt(fChosen);
  const constrained = !feasible || Math.abs(fChosen - fOtis) > 1e-6;

  // ── Scores ────────────────────────────────────────────────────────────────
  const prot       = calcLungProtection(params, fActualHz, vtActual);
  const wobActual  = calcWOB(params, fActualHz, vtActual);
  const wobOtis    = calcWOB(params, otis.fOptHz, otis.vtOpt);

  // WOB-score: hoe dicht bij het theoretische minimum?
  const wobScore = Math.max(0, Math.min(100,
    100 - ((wobActual.perMinute - wobOtis.perMinute) / Math.max(wobOtis.perMinute, 0.001)) * 100
  ));

  // Longbescherming-score: penaliseer overschrijding limieten
  let protScore = 100;
  if (prot.drivingPressure > LIMITS.drivingPressure) protScore -= (prot.drivingPressure - LIMITS.drivingPressure) * 5;
  if (prot.peakPressure > params.pLimit) protScore -= (prot.peakPressure - params.pLimit) * 5;
  if (prot.vtPerKg > LIMITS.vtPerKg) protScore -= (prot.vtPerKg - LIMITS.vtPerKg) * 10;
  if (prot.mechPower > LIMITS.mechPower) protScore -= (prot.mechPower - LIMITS.mechPower) * 2;
  protScore = Math.max(0, Math.min(100, protScore));

  return {
    fOtis:           otis.fOptBpm,
    vtOtis:          otis.vtOpt,
    fActual:         fChosen,
    vtActual,
    constrained,
    limitingFactor,
    feasible,
    fMinBpm,
    fMaxBpm,
    vtMin:           2 * vd,
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
  const fSteps  = 36; // 4..40 bpm
  const vtSteps = 26; // 0.2..1.5 L

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
  return (params.pLimit - totalPeep) / peakPressurePerLitre(C, params.resistance, fBpm / 60);
}

/**
 * Genereert de ventilatiehyperbool (VT = V̇A/f + VD) voor f = 4..40 bpm.
 */
export function generateVentilationHyperbola(
  params: VentilatorParams
): { f: number; vt: number }[] {
  const result = [];
  for (let fBpm = 4; fBpm <= 40; fBpm += 0.5) {
    const vt = calcVtHyperbolaAtF(params, fBpm);
    if (vt > 0.15 && vt < 2.0) result.push({ f: fBpm, vt });
  }
  return result;
}

/**
 * Genereert de druk-limietlijn in het (f, VT)-vlak.
 * VT_max(f) = (Plimit − PEEP_tot) / [1/(2C) + √(1/(4C²) + (R·π·f)²)]
 */
export function generatePressureLimitLine(
  params: VentilatorParams
): { f: number; vt: number }[] {
  const result = [];
  for (let fBpm = 4; fBpm <= 40; fBpm += 0.5) {
    const vt = calcVtPressureLimitAtF(params, fBpm);
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
