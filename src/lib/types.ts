// ─── Ventilator parameter state ───────────────────────────────────────────────

export interface VentilatorParams {
  /** PEEP (cmH₂O) */
  peep: number;
  /** Maximale inspiratiedruk (cmH₂O) */
  pLimit: number;
  /** Luchtwegweerstand R (cmH₂O·s/L) */
  resistance: number;
  /** Compliance C (mL/cmH₂O); τ = R·C wordt hieruit afgeleid */
  compliance: number;
  /** Ideaal lichaamsgewicht IBW (kg) */
  ibw: number;
  /** Alveolair doelminuutvolume V̇A (L/min) */
  vaTarget: number;
  /** Drukstijgtijd P-ramp (ms): tijd tot ~95% van de inspiratiedruk */
  pRamp: number;
  /** Gemeten PEEPi bij expiratoire hold (cmH₂O); 0 = niet gemeten */
  peepiMeasured: number;
  /** Eigen ademfrequentie van de patiënt (/min); 0 = passief */
  fSpont: number;
  /**
   * Criterium voor het doel: "otis" = minste arbeid (oorspronkelijk ASV),
   * "mead" = minste drukamplitude per teug (richting ASV 1.1). Standaard "otis".
   */
  doelModel?: DoelModel;
}

export type DoelModel = "otis" | "mead";

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
  /** Piekdruk = inspiratiedruk Pinsp bij drukgecontroleerde teug (cmH₂O) */
  peakPressure: number;
  /** Plateaudruk aan eind-inspiratie (cmH₂O) */
  platPressure: number;
  /** Gebruikte intrinsieke PEEP: max(modelvoorspelling, gemeten) (cmH₂O) */
  autoPeep: number;
  /** VT per kg IBW (mL/kg) */
  vtPerKg: number;
  /** Mechanisch vermogen (J/min) */
  mechPower: number;
  /** Totaal PEEP (cmH₂O) */
  totalPeep: number;
}

export interface BreathResult {
  /** Inspiratie- en expiratietijd (s) */
  ti: number;
  te: number;
  /** Inspiratiedruk boven PEEP (cmH₂O) */
  deltaPinsp: number;
  /** Ingesteld PEEP + deltaPinsp (cmH₂O) */
  pinsp: number;
  /** Achtergebleven volume aan eind-expiratie boven FRC bij PEEP (L) */
  trappedVolume: number;
  /** Gebruikte intrinsieke PEEP: max(model, gemeten) (cmH₂O) */
  autoPeep: number;
  /** Door het lineaire model voorspelde dynamische PEEPi (cmH₂O) */
  autoPeepModel: number;
  /** Deel van de gemeten PEEPi boven het model, toegeschreven aan flowbeperking (cmH₂O) */
  flowLimitedPeep: number;
  /** Inspiratoire energie ∫Paw·dV per teug (cmH₂O·L) */
  inspEnergy: number;
}

export interface MeasuredBreath {
  /** Ademt de patiënt boven de doelfrequentie (alle teugen spontaan)? */
  spontaneous: boolean;
  /** Gemeten frequentie (/min) en teugvolume (L) */
  fBpm: number;
  vt: number;
  /** Verplichte (machine)teugen per minuut */
  mandatoryBpm: number;
  /** Gemeten minuutvolume en alveolaire ventilatie (L/min) */
  minuteVolume: number;
  alveolarVentilation: number;
}

export interface ProtectionScore {
  key: string;
  label: string;
  /** 0–100, 100 = volledig binnen veilige zone */
  score: number;
  value: string;
  limit: string;
}

export interface iASVDecision {
  /** Gebruikt criterium voor het doel */
  doelModel: DoelModel;
  /** Otis-optimum f (bpm) */
  fOtis: number;
  /** Otis-optimum VT (L) */
  vtOtis: number;
  /** Mead-optimum f (bpm) */
  fMead: number;
  /** Mead-optimum VT (L) */
  vtMead: number;
  /** Werkelijk toegepaste f na limieten (bpm) */
  fActual: number;
  /** Werkelijk toegepaste VT na limieten (L) */
  vtActual: number;
  /** Is het optimum gekortwiekt door een veiligheidsgrens? */
  constrained: boolean;
  /** Welke limiet is actief? */
  limitingFactor: string;
  /** Bestaat er een werkpunt op de V̇A-hyperbool dat aan alle limieten voldoet? */
  feasible: boolean;
  /** Frequentievenster volgens ASV-regels (bpm) */
  fMinBpm: number;
  fMaxBpm: number;
  /** Minimaal VT volgens ASV-regel 2 × VD (L) */
  vtMin: number;
  /** Score longbescherming 0–100 */
  protectionScore: number;
  /** Score WOB-efficiëntie 0–100 */
  wobScore: number;
  /** Doelminuutvolume V̇E = VT · f in het doelpunt (L/min) */
  minuteVolume: number;
  /** Werkelijk gemeten teug bij eigen ademactiviteit */
  measured: MeasuredBreath;
}

export interface WorkspacePoint {
  f: number;   // breaths/min
  vt: number;  // L
  wob: number; // J/min
}
