// ─── Ventilator parameter state ───────────────────────────────────────────────

export interface VentilatorParams {
  /** PEEP (cmH₂O) */
  peep: number;
  /** Intrinsiek auto-PEEP (cmH₂O) */
  autoPeep: number;
  /** Druk limiet / P_high (cmH₂O) */
  pLimit: number;
  /** Luchtwegweerstand R (cmH₂O·s/L) */
  resistance: number;
  /** Expiratoire tijdconstante RC_exp (s) */
  rcExp: number;
  /** Ideaal lichaamsgewicht IBW (kg) */
  ibw: number;
  /** Alveolair doelminuutvolume V̇A (L/min) */
  vaTarget: number;
}

// ─── Resultaattypen ────────────────────────────────────────────────────────────

export interface OtisResult {
  /** Optimale frequentie (breaths/min) */
  fOptHz: number;
  fOptBpm: number;
  /** Optimaal teugvolume (L) */
  vtOpt: number;
  /** Dead space (L) */
  vd: number;
  /** Compliance C (L/cmH₂O) */
  compliance: number;
  /** Tijdconstante τ (s) */
  tau: number;
}

export interface WOBResult {
  /** Elastisch werk per adem (J) */
  elastic: number;
  /** Resistief werk per adem (J) */
  resistive: number;
  /** Intrinsiek PEEP-werk per adem (J) */
  intrinsic: number;
  /** Totaal werk per adem (J) */
  perBreath: number;
  /** Totaal werk per minuut (J/min) */
  perMinute: number;
}

export interface LungProtectionResult {
  /** Driving pressure ΔP = VT/C (cmH₂O) */
  drivingPressure: number;
  /** Piekdruk (cmH₂O) */
  peakPressure: number;
  /** Plateaudruk (cmH₂O) */
  platPressure: number;
  /** VT per kg IBW (mL/kg) */
  vtPerKg: number;
  /** Mechanisch vermogen (J/min) */
  mechPower: number;
  /** Totaal PEEP (cmH₂O) */
  totalPeep: number;
}

export interface iASVDecision {
  /** Otis-optimum f (bpm) */
  fOtis: number;
  /** Otis-optimum VT (L) */
  vtOtis: number;
  /** Werkelijk toegepaste f na limieten (bpm) */
  fActual: number;
  /** Werkelijk toegepaste VT na limieten (L) */
  vtActual: number;
  /** Is het optimum gekortwiekt door een veiligheidsgrens? */
  constrained: boolean;
  /** Welke limiet is actief? */
  limitingFactor: string;
  /** Score longbescherming 0–100 */
  protectionScore: number;
  /** Score WOB-efficiëntie 0–100 */
  wobScore: number;
}

export interface WorkspacePoint {
  f: number;   // breaths/min
  vt: number;  // L
  wob: number; // J/min
}
