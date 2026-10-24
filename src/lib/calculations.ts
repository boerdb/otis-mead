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
 * Model: één-compartiment long met lineaire R en C.
 *  - Het doel (f, VT) volgt uit de Otis-vergelijking (minste arbeid; oorspronkelijk ASV) of,
 *    naar keuze, uit de Mead-vergelijking (minste drukamplitude per teug). ASV 1.1 (2017) weegt
 *    beide mee; Hamilton publiceert die weging niet, dus de simulator toont beide optima.
 *  - Mead-vorm: van der Staay M, Chatburn RL (2018) "Advanced modes of mechanical ventilation and optimal
 *    targeting schemes" Intensive Care Med Exp 6:30, doi:10.1186/s40635-018-0195-0
 *  - De ademteug wordt drukgecontroleerd afgegeven zoals bij ASV: blokvormige
 *    inspiratiedruk, I:E = 1:2, passieve exponentiële expiratie, in stationaire toestand.
 *    Onvolledige expiratie levert dynamische auto-PEEP op.
 *
 * Eenheden:
 *   Druk  → cmH₂O
 *   Volume → L
 *   Tijd  → s
 *   Flow  → L/s (curven in L/min)
 *   Werk  → J  (1 cmH₂O·L = 0.0980665 J)
 */

import type {
  VentilatorParams,
  OtisResult,
  WOBResult,
  LungProtectionResult,
  BreathResult,
  ProtectionScore,
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
  autoPeep:        5,  // cmH₂O
} as const;

/** ASV-regels: f ≥ 5/min, f ≤ 60/min en f ≤ 20/τ (Ti ≥ 1τ, Te ≥ 2τ). */
export const ASV_F_MIN_BPM = 5;
export const ASV_F_MAX_BPM = 60;

/** Verhouding Te/Ti van de afgegeven ademteug (I:E = 1:2). */
export const IE_RATIO = 2;

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

// ─── Mead-formule ─────────────────────────────────────────────────────────────

/**
 * Mead (1960): de frequentie waarbij de gemiddelde kracht (drukamplitude) per teug
 * minimaal is bij constante V̇A. Bij sinusoïdale flow is de amplitude van
 * P = V/C + R·V̇ gelijk aan (VT/2)·√(E² + (2πfR)²). Langs VT = V̇A/f + VD differentiëren
 * en nul stellen geeft exact (geen benadering):
 *
 *   V̇A = VD · (2πτ)² · f³   ⇒   f = (V̇A/VD)^(1/3) · (2πτ)^(−2/3)   [Hz]
 */
export function calcMead(params: VentilatorParams): OtisResult {
  const C = calcCompliance(params);
  const vd = calcDeadSpace(params);
  const tau = calcTau(params);
  const VA_s = params.vaTarget / 60; // L/s

  const fHz = Math.cbrt(VA_s / vd) * Math.pow(2 * Math.PI * tau, -2 / 3);
  const vtOpt = VA_s / fHz + vd;

  return { fOptHz: fHz, fOptBpm: fHz * 60, vtOpt, vd, compliance: C, tau };
}

/** Drukamplitude per teug bij sinusoïdale flow (cmH₂O): (VT/2)·√(E² + (2πfR)²). Meads kostfunctie. */
export function calcForceAmplitude(params: VentilatorParams, fHz: number, vt: number): number {
  const E = 1 / calcCompliance(params);
  return (vt / 2) * Math.hypot(E, 2 * Math.PI * fHz * params.resistance);
}

// ─── WOB-berekening (Otis sinusoïdaal profiel) ───────────────────────────────

/**
 * Inspiratoire arbeid voor één adem bij sinusoïdaal flowprofiel:
 *
 *   W_el    = VT² / (2C)                   [cmH₂O·L]
 *   W_res   = π²·R·f·VT² / 4               [cmH₂O·L]  (alleen inspiratie)
 *   W_iPEEP = PEEPi · VT                   [cmH₂O·L]
 *
 * PEEPi is de dynamische auto-PEEP van de afgegeven ademteug (zie calcBreath).
 * Expiratie is passief en telt niet mee. Alles × 0.098 → Joule.
 */
export function calcWOB(
  params: VentilatorParams,
  fHz: number,
  vt: number
): WOBResult {
  const C = calcCompliance(params);
  const { autoPeep } = calcBreath(params, fHz, vt);

  const elastic   = (vt ** 2 / (2 * C))                  * CMH2O_TO_JOULE;
  const resistive = (PI2 * params.resistance * fHz * vt ** 2) / 4 * CMH2O_TO_JOULE;
  const intrinsic = autoPeep * vt                        * CMH2O_TO_JOULE;

  const perBreath  = elastic + resistive + intrinsic;
  const perMinute  = perBreath * fHz * 60;

  return { elastic, resistive, intrinsic, perBreath, perMinute };
}

// ─── Drukgecontroleerde ademteug ─────────────────────────────────────────────

/** Tijdconstante waarmee de druk na het openen van de expiratieklep naar PEEP zakt (s). */
export const EXP_VALVE_TAU = 0.02;

/**
 * Vorm van de stationaire drukgecontroleerde ademteug per 1 cmH₂O inspiratiedruk.
 *
 * Luchtwegdruk boven PEEP, u(t):
 *   inspiratie  u = A·(1 − e^(−t/τr))          τr = P-ramp / 3 (95% na de P-ramp)
 *   expiratie   u = A·B·e^(−s/τv)              B = 1 − e^(−Ti/τr), τv = klepafname
 * Long: τ·dV/dt + V = C·u, met V boven FRC bij PEEP.
 *
 * Exacte oplossing voor exponentiële ingangen:
 *   inspiratie  V(t) = C·A + K·e^(−t/τr) + (V₀ − C·A − K)·e^(−t/τ),   K  = −C·A·τr/(τr − τ)
 *   expiratie   V(s) = K₂·e^(−s/τv) + (V₁ − K₂)·e^(−s/τ),           K₂ = C·A·B·τv/(τv − τ)
 * Stationair: V aan het eind van de expiratie = V₀. Alles is lineair in A.
 */
function breathShape(params: VentilatorParams, fHz: number) {
  const C   = calcCompliance(params);
  const tau = calcTau(params);
  const T   = 1 / fHz;
  const ti  = T / (1 + IE_RATIO);
  const te  = T - ti;
  // Voorkom deling door nul als een ingangsconstante toevallig gelijk is aan τ.
  const distinct = (t: number) => (Math.abs(t - tau) < 1e-9 ? t * (1 + 1e-6) + 1e-9 : t);
  const tauR = distinct(Math.max(params.pRamp / 1000 / 3, 1e-6));
  const tauV = distinct(EXP_VALVE_TAU);

  const K  = (-C * tauR) / (tauR - tau);
  const x  = Math.exp(-ti / tau);
  const a  = C + K * Math.exp(-ti / tauR) - (C + K) * x; // V₁ = a + x·V₀
  const B  = 1 - Math.exp(-ti / tauR);
  const K2 = (C * B * tauV) / (tauV - tau);
  const y  = Math.exp(-te / tau);
  const b  = K2 * Math.exp(-te / tauV) - K2 * y;           // V_eind = b + y·V₁

  const v0 = (b + y * a) / (1 - x * y);
  const v1 = a + x * v0;

  // Door de klepafname stroomt er na Ti nog kort lucht in: het piekvolume ligt waar
  // dV/ds = 0, oftewel e^(s·(1/τ − 1/τv)) = −(V₁ − K₂)·τv / (K₂·τ).
  let vMax = v1;
  const r = (-(v1 - K2) * tauV) / (K2 * tau);
  if (r > 0) {
    const sPeak = Math.log(r) / (1 / tau - 1 / tauV);
    if (sPeak > 0 && sPeak < te) {
      vMax = K2 * Math.exp(-sPeak / tauV) + (v1 - K2) * Math.exp(-sPeak / tau);
    }
  }

  return { C, tau, ti, te, tauR, tauV, K, B, K2, v0, v1, vMax };
}

/**
 * Stationaire drukgecontroleerde ademteug (zie breathShape) voor een gegeven VT.
 * VT is piekvolume min eind-expiratoir volume (zoals de ventilator meet), dus
 * ΔPinsp = VT / (V_max − V₀) per cmH₂O; PEEPi = V₀ / C.
 *
 * Gemeten PEEPi (expiratoire hold) boven de modelvoorspelling wordt toegeschreven aan
 * expiratoire flowbeperking, die het lineaire model niet bevat. Dat deel verhoogt de
 * alveolaire basisdruk: de inspiratiedruk moet het eerst overwinnen voordat er flow is,
 * dus Pinsp stijgt met dat deel (en daarmee de inspiratoire energie).
 */
export function calcBreath(params: VentilatorParams, fHz: number, vt: number): BreathResult {
  const s = breathShape(params, fHz);
  const deltaPinsp    = vt / (s.vMax - s.v0);
  const trappedVolume = s.v0 * deltaPinsp;
  const autoPeepModel = trappedVolume / s.C;
  const flowLimitedPeep = Math.max(0, params.peepiMeasured - autoPeepModel);

  // Inspiratoire energie ∫Paw·dV = PEEP·VT + ∫u·dV, met dV/dt = c1·e^(−t/τr) + c2·e^(−t/τ)
  const c1 = -s.K / s.tauR;
  const c2 = -(s.v0 - s.C - s.K) / s.tau;
  const I  = (rate: number) => (1 - Math.exp(-rate * s.ti)) / rate;
  const uDvPerUnit =
    c1 * I(1 / s.tauR) + c2 * I(1 / s.tau) - c1 * I(2 / s.tauR) - c2 * I(1 / s.tauR + 1 / s.tau);

  return {
    ti: s.ti,
    te: s.te,
    deltaPinsp,
    pinsp: params.peep + flowLimitedPeep + deltaPinsp,
    trappedVolume,
    autoPeep: autoPeepModel + flowLimitedPeep,
    autoPeepModel,
    flowLimitedPeep,
    // Paw = PEEP + (ΔPinsp + flowbeperkt deel)·u, dus ∫Paw·dV = PEEP·VT + (ΔPinsp + e)·ΔPinsp·∫u·dV₁
    inspEnergy: params.peep * vt + (deltaPinsp + flowLimitedPeep) * deltaPinsp * uDvPerUnit,
  };
}

// ─── Longbescherming ──────────────────────────────────────────────────────────

export function calcLungProtection(
  params: VentilatorParams,
  fHz: number,
  vt: number
): LungProtectionResult {
  const C      = calcCompliance(params);
  const breath = calcBreath(params, fHz, vt);
  const totalPeep = params.peep + breath.autoPeep;

  const drivingPressure = vt / C;
  const peakPressure    = breath.pinsp;
  const platPressure    = totalPeep + drivingPressure;
  const vtPerKg         = (vt * 1000) / params.ibw;

  // Mechanisch vermogen (Gattinoni 2016): energie per inspiratie = ∫Paw·dV.
  const mechPower = CMH2O_TO_JOULE * fHz * 60 * breath.inspEnergy;

  return {
    drivingPressure,
    peakPressure,
    platPressure,
    autoPeep: breath.autoPeep,
    vtPerKg,
    mechPower,
    totalPeep,
  };
}

/** Lineaire score: 100 tot `good`, 50 op de grens, 0 vanaf `bad`. */
function bandScore(v: number, good: number, limit: number, bad: number): number {
  if (v <= good) return 100;
  if (v <= limit) return 100 - 50 * ((v - good) / (limit - good));
  if (v >= bad) return 0;
  return 50 - 50 * ((v - limit) / (bad - limit));
}

/** Longbeschermingsscores per maat; een waarde precies op de grens scoort 50. */
export function calcProtectionScores(
  params: VentilatorParams,
  prot: LungProtectionResult
): ProtectionScore[] {
  const p = params.pLimit;
  return [
    {
      key: "dp", label: "Driving pressure",
      score: bandScore(prot.drivingPressure, 10, LIMITS.drivingPressure, 20),
      value: `${prot.drivingPressure.toFixed(1)} cmH₂O`, limit: `≤ ${LIMITS.drivingPressure}`,
    },
    {
      key: "pplat", label: "Plateaudruk",
      score: bandScore(prot.platPressure, 25, LIMITS.platPressure, 35),
      value: `${prot.platPressure.toFixed(1)} cmH₂O`, limit: `≤ ${LIMITS.platPressure}`,
    },
    {
      key: "pinsp", label: "Pinsp",
      score: bandScore(prot.peakPressure, p - 10, p, p + 5),
      value: `${prot.peakPressure.toFixed(1)} cmH₂O`, limit: `≤ ${p}`,
    },
    {
      key: "vtkg", label: "VT/kg",
      score: bandScore(prot.vtPerKg, 6, LIMITS.vtPerKg, 10),
      value: `${prot.vtPerKg.toFixed(1)} mL/kg`, limit: `≤ ${LIMITS.vtPerKg}`,
    },
    {
      key: "mp", label: "Mech. vermogen",
      score: bandScore(prot.mechPower, 10, LIMITS.mechPower, 25),
      value: `${prot.mechPower.toFixed(1)} J/min`, limit: `≤ ${LIMITS.mechPower}`,
    },
    {
      key: "peepi", label: "Auto-PEEP",
      score: bandScore(prot.autoPeep, 1, LIMITS.autoPeep, 10),
      value: `${prot.autoPeep.toFixed(1)} cmH₂O`, limit: `≤ ${LIMITS.autoPeep}`,
    },
  ];
}

// ─── iASV beslissingsalgoritme ────────────────────────────────────────────────

interface Constraint {
  label: string;
  ok: (fBpm: number, vt: number, prot: LungProtectionResult) => boolean;
}

/** Frequentievenster volgens de ASV-regels (bpm). */
export function calcFrequencyWindow(params: VentilatorParams): { fMinBpm: number; fMaxBpm: number } {
  return {
    fMinBpm: ASV_F_MIN_BPM,
    fMaxBpm: Math.min(ASV_F_MAX_BPM, 20 / calcTau(params)),
  };
}

function buildConstraints(params: VentilatorParams): Constraint[] {
  const vd = calcDeadSpace(params);
  const { fMinBpm, fMaxBpm } = calcFrequencyWindow(params);
  const eps = 1e-9;

  return [
    { label: `Minimale frequentie (${ASV_F_MIN_BPM}/min)`, ok: (f) => f >= fMinBpm - eps },
    { label: "Maximale frequentie (20/τ — auto-PEEP-preventie)", ok: (f) => f <= fMaxBpm + eps },
    { label: "Minimaal VT (2 × VD)", ok: (_, vt) => vt >= 2 * vd - eps },
    { label: "Druk limiet (Pinsp)", ok: (_, __, p) => p.peakPressure <= params.pLimit + eps },
    {
      label: `Driving pressure (ΔP ≤ ${LIMITS.drivingPressure})`,
      ok: (_, __, p) => p.drivingPressure <= LIMITS.drivingPressure + eps,
    },
    {
      label: `Plateaudruk (≤ ${LIMITS.platPressure} cmH₂O)`,
      ok: (_, __, p) => p.platPressure <= LIMITS.platPressure + eps,
    },
    {
      label: `VT/kg-grens (${LIMITS.vtPerKg} mL/kg)`,
      ok: (_, __, p) => p.vtPerKg <= LIMITS.vtPerKg + eps,
    },
  ];
}

/**
 * Simuleert de iASV-keuze in het Otis-model:
 *  1. Bereken het doel (Otis- of Mead-optimum) op de V̇A-hyperbool
 *  2. Bepaal welke punten op de hyperbool aan alle limieten voldoen
 *  3. Kies het toegestane punt met f het dichtst bij f_Otis (V̇A blijft gelijk)
 *  4. Rapporteer welke limiet de verschuiving veroorzaakt
 *
 * Langs de hyperbool hangen alle limieten van f af (Pinsp en auto-PEEP via VT én f),
 * dus de grens wordt gezamenlijk opgelost in plaats van alleen VT af te kappen.
 */
export function calcIASV(params: VentilatorParams): iASVDecision {
  const otis      = calcOtis(params);
  const mead      = calcMead(params);
  const doelModel = params.doelModel ?? "otis";
  const doel      = doelModel === "mead" ? mead : otis;
  const doelNaam  = doelModel === "mead" ? "Mead-optimum" : "Otis-optimum";
  const vd        = otis.vd;
  const VA_s      = params.vaTarget / 60;
  const { fMinBpm, fMaxBpm } = calcFrequencyWindow(params);
  const constraints = buildConstraints(params);

  const vtAt = (fBpm: number) => VA_s / (fBpm / 60) + vd;
  const failing = (fBpm: number) => {
    const vt = vtAt(fBpm);
    const prot = calcLungProtection(params, fBpm / 60, vt);
    return constraints.filter((c) => !c.ok(fBpm, vt, prot)).map((c) => c.label);
  };
  const feasibleAt = (fBpm: number) => failing(fBpm).length === 0;

  const fOtis = doel.fOptBpm; // doel van het gekozen criterium (Otis of Mead)
  let fChosen = fOtis;
  let feasible = true;
  let limitingFactor = `Geen — ${doelNaam}`;

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

  // ── Gemeten teug bij eigen ademactiviteit ─────────────────────────────────
  // ASV vult aan tot de doelfrequentie met verplichte teugen. Ademt de patiënt sneller,
  // dan zijn alle teugen spontaan en houdt ASV het minuutvolume vast: VT = V̇E / f.
  // Het gemeten punt schuift dan over de V̇E-hyperbool en V̇A daalt (meer dode-ruimteventilatie).
  const minuteVolume = vtActual * fChosen;
  const spontaneous  = params.fSpont > fChosen;
  const fMeasured    = spontaneous ? params.fSpont : fChosen;
  const vtMeasured   = minuteVolume / fMeasured;

  // WOB-score: hoe dicht bij het theoretische minimum?
  const wobScore = Math.max(0, Math.min(100,
    100 - ((wobActual.perMinute - wobOtis.perMinute) / Math.max(wobOtis.perMinute, 0.001)) * 100
  ));

  // Longbescherming-score: gemiddelde van de afzonderlijke maten (zelfde als de radar)
  const scores    = calcProtectionScores(params, prot);
  const protScore = scores.reduce((sum, x) => sum + x.score, 0) / scores.length;

  return {
    doelModel,
    fOtis:           otis.fOptBpm,
    vtOtis:          otis.vtOpt,
    fMead:           mead.fOptBpm,
    vtMead:          mead.vtOpt,
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
    minuteVolume,
    measured: {
      spontaneous,
      fBpm: fMeasured,
      vt: vtMeasured,
      mandatoryBpm: Math.max(0, fChosen - params.fSpont),
      minuteVolume,
      alveolarVentilation: (vtMeasured - vd) * fMeasured,
    },
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

/** VT op de druk-limietlijn bij gegeven f (bpm): het VT waarbij Pinsp = Plimit. */
export function calcVtPressureLimitAtF(params: VentilatorParams, fBpm: number): number {
  // ΔPinsp is lineair in VT, dus VT_max = (Plimit − PEEP) / (ΔPinsp per liter)
  const perLitre = calcBreath(params, fBpm / 60, 1).deltaPinsp;
  return (params.pLimit - params.peep) / perLitre;
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
 * VT_max(f) = (Plimit − PEEP) · C·(1 − x)·(1 − y) / (1 − x·y)
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
 * Dynamische druk-volumelus van de drukgecontroleerde ademteug, afgeleid uit één cyclus
 * van de tijdcurven (met P-ramp en klepafname, dus met afgeronde hoeken).
 *  - loop: luchtwegdruk Paw tegen ventilatorvolume (0..VT)
 *  - alveolar: alveolaire druk Palv = PEEP_tot + V/C (statische lijn)
 * Het oppervlak tussen beide is de resistieve energie.
 */
export function generatePVLoop(
  params: VentilatorParams,
  fHz: number,
  vt: number
): { loop: { p: number; v: number }[]; alveolar: { p: number; v: number }[] } {
  const C      = calcCompliance(params);
  const breath = calcBreath(params, fHz, vt);
  const totalPeep = params.peep + breath.autoPeep;

  return {
    loop: generateTimeCurves(params, fHz, vt, 1, 400).map((pt) => ({ p: pt.paw, v: pt.volume })),
    alveolar: [
      { p: totalPeep,          v: 0 },
      { p: totalPeep + vt / C, v: vt * 1000 },
    ],
  };
}

/**
 * Druk-, flow- en volumecurven van de drukgecontroleerde ademteug (stationair),
 * met de exacte oplossing uit breathShape geschaald naar de benodigde ΔPinsp (= A).
 *
 *   inspiratie: Paw = PEEP + (A + e)·(1 − e^(−t/τr))
 *   expiratie:  Paw = PEEP + (A + e)·B·e^(−s/τv)
 *   Palv = PEEP + e + V/C,  flow = dV/dt
 * met e de flowbeperkte PEEPi (gemeten boven model). Flowbeperking zelf zit niet
 * in de flowcurve; alleen de verhoogde alveolaire basisdruk.
 *
 * Volume is ventilatorvolume: V − V₀ (0 aan begin inspiratie).
 */
export function generateTimeCurves(
  params: VentilatorParams,
  fHz: number,
  vt: number,
  cycles = 2,
  stepsPerCycle = 240
): { t: number; flow: number; paw: number; palv: number; volume: number }[] {
  const s = breathShape(params, fHz);
  const A = vt / (s.vMax - s.v0); // ΔPinsp
  const e = calcBreath(params, fHz, vt).flowLimitedPeep;
  const T = 1 / fHz;
  const result = [];

  for (let i = 0; i <= cycles * stepsPerCycle; i++) {
    const t  = (i / stepsPerCycle) * T;
    // Tijd binnen de cyclus; het laatste punt is het einde van de laatste expiratie.
    const tc = i === cycles * stepsPerCycle ? T : t - Math.floor(i / stepsPerCycle) * T;
    let v: number, flow: number, u: number;

    if (tc < s.ti) {
      const er = Math.exp(-tc / s.tauR);
      const e  = Math.exp(-tc / s.tau);
      const h  = s.v0 - s.C - s.K;
      v    = s.C + s.K * er + h * e;
      flow = (-s.K / s.tauR) * er - (h / s.tau) * e;
      u    = 1 - er;
    } else {
      const ts = tc - s.ti;
      const ev = Math.exp(-ts / s.tauV);
      const e  = Math.exp(-ts / s.tau);
      const h  = s.v1 - s.K2;
      v    = s.K2 * ev + h * e;
      flow = (-s.K2 / s.tauV) * ev - (h / s.tau) * e;
      u    = s.B * ev;
    }

    result.push({
      t,
      flow: A * flow * 60,              // L/min
      paw: params.peep + (A + e) * u,
      palv: params.peep + e + (A * v) / s.C,
      volume: A * (v - s.v0) * 1000,    // mL
    });
  }
  return result;
}
