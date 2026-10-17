import { describe, it, expect } from "vitest";
import {
  LIMITS,
  calcBreath,
  calcCompliance,
  calcDeadSpace,
  calcFrequencyWindow,
  calcIASV,
  calcLungProtection,
  calcOtis,
  calcProtectionScores,
  calcTau,
  calcVtPressureLimitAtF,
  calcWOB,
  EXP_VALVE_TAU,
  generateTimeCurves,
} from "./calculations";
import type { VentilatorParams } from "./types";

const base: VentilatorParams = {
  peep: 5,
  pLimit: 30,
  resistance: 10,
  compliance: 50,
  ibw: 70,
  vaTarget: 5,
  pRamp: 50,
  peepiMeasured: 0,
  fSpont: 0,
};

const J = 0.0980665;

/** Numerieke integratie (Simpson) van g over [a, b]. */
function integrate(g: (x: number) => number, a: number, b: number, n = 2000): number {
  const h = (b - a) / n;
  let sum = g(a) + g(b);
  for (let i = 1; i < n; i++) sum += g(a + i * h) * (i % 2 ? 4 : 2);
  return (sum * h) / 3;
}

/** Sinusoïdale inspiratie (Otis-aanname): volume en flow op tijdstip t ∈ [0, 1/(2f)]. */
function sineBreath(fHz: number, vt: number) {
  const volume = (t: number) => (vt / 2) * (1 - Math.cos(2 * Math.PI * fHz * t));
  const flow = (t: number) => Math.PI * fHz * vt * Math.sin(2 * Math.PI * fHz * t);
  return { volume, flow, tInsp: 1 / (2 * fHz) };
}

/**
 * Simuleert de drukgecontroleerde ademteug numeriek (Euler) tot stationaire toestand:
 * dV/dt = (Paw − PEEP − V/C) / R, met V boven FRC bij PEEP, P-ramp en klepafname.
 */
function simulatePcv(p: VentilatorParams, fHz: number, deltaPinsp: number, cycles = 60) {
  const C = calcCompliance(p);
  const R = p.resistance;
  const T = 1 / fHz;
  const ti = T / 3;
  const tauR = Math.max(p.pRamp / 1000 / 3, 1e-6);
  const B = 1 - Math.exp(-ti / tauR);
  const n = 6000;
  const dt = T / n;
  let v = 0;
  let vEndExp = 0;
  let vMax = 0;
  for (let c = 0; c < cycles; c++) {
    for (let i = 0; i < n; i++) {
      const t = i * dt;
      const paw = t < ti
        ? deltaPinsp * (1 - Math.exp(-t / tauR))
        : deltaPinsp * B * Math.exp(-(t - ti) / EXP_VALVE_TAU);
      v += ((paw - v / C) / R) * dt;
    }
    vEndExp = v;
  }
  // Laatste cyclus nogmaals voor het piekvolume (stationair, dus gelijk aan de vorige).
  for (let i = 0; i < n; i++) {
    const t = i * dt;
    const paw = t < ti
      ? deltaPinsp * (1 - Math.exp(-t / tauR))
      : deltaPinsp * B * Math.exp(-(t - ti) / EXP_VALVE_TAU);
    v += ((paw - v / C) / R) * dt;
    vMax = Math.max(vMax, v);
  }
  return { vt: vMax - vEndExp, trapped: vEndExp };
}

/** Deterministische pseudo-random generator voor parametersweeps. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}

function randomParams(rand: () => number): VentilatorParams {
  return {
    peep: 0 + rand() * 20,
    pLimit: 15 + rand() * 35,
    resistance: 2 + rand() * 28,
    compliance: 10 + rand() * 110,
    ibw: 40 + rand() * 80,
    vaTarget: 2 + rand() * 10,
    pRamp: rand() * 200,
    peepiMeasured: rand() < 0.5 ? 0 : rand() * 10,
    fSpont: 0,
  };
}

describe("afgeleide grootheden", () => {
  it("rekent compliance om van mL naar L en τ = R·C", () => {
    expect(calcCompliance(base)).toBeCloseTo(0.05, 12);
    expect(calcTau(base)).toBeCloseTo(0.5, 12);
  });

  it("gebruikt VD = 2.2 mL/kg IBW", () => {
    expect(calcDeadSpace(base)).toBeCloseTo(0.154, 12);
  });
});

describe("Otis-optimum", () => {
  it("geeft de verwachte waarde voor het standaardscenario", () => {
    // f = [√(1 + 4π²·0.5·(5/60)/0.154) − 1] / (2π²·0.5) Hz
    const otis = calcOtis(base);
    expect(otis.fOptBpm).toBeCloseTo(14.66, 1);
    expect(otis.vtOpt * 1000).toBeCloseTo(495, -1);
  });

  it("valt samen met het numerieke minimum van de inspiratoire arbeid langs de V̇A-hyperbool", () => {
    const rand = rng(42);
    for (let i = 0; i < 50; i++) {
      const p = randomParams(rand);
      const C = calcCompliance(p);
      const vd = calcDeadSpace(p);
      const VA = p.vaTarget / 60;
      // Otis-criterium: elastisch + resistief werk bij sinusoïdale flow (zonder PEEPi)
      const wobAt = (fBpm: number) => {
        const f = fBpm / 60;
        const vt = VA / f + vd;
        return fBpm * (vt ** 2 / (2 * C) + (Math.PI ** 2 * p.resistance * f * vt ** 2) / 4);
      };

      // Grof raster, daarna gulden-snede-zoeken rond het beste rasterpunt.
      let bestF = 0.5;
      for (let f = 0.5; f <= 1000; f += 0.5) if (wobAt(f) < wobAt(bestF)) bestF = f;
      let lo = Math.max(0.01, bestF - 0.5);
      let hi = bestF + 0.5;
      const g = (Math.sqrt(5) - 1) / 2;
      for (let k = 0; k < 100; k++) {
        const a = hi - g * (hi - lo);
        const b = lo + g * (hi - lo);
        if (wobAt(a) < wobAt(b)) hi = b; else lo = a;
      }

      expect(calcOtis(p).fOptBpm).toBeCloseTo((lo + hi) / 2, 3);
    }
  });

  it("verschuift in de fysiologisch juiste richting", () => {
    const f = (p: Partial<VentilatorParams>) => calcOtis({ ...base, ...p }).fOptBpm;
    // Lagere compliance (restrictief, kortere τ) → hogere frequentie
    expect(f({ compliance: 25 })).toBeGreaterThan(f({ compliance: 50 }));
    // Hogere weerstand (obstructief, langere τ) → lagere frequentie
    expect(f({ resistance: 20 })).toBeLessThan(f({ resistance: 10 }));
    // Meer dode ruimte (hoger IBW) bij gelijke V̇A → lagere frequentie
    expect(f({ ibw: 100 })).toBeLessThan(f({ ibw: 70 }));
    // Hogere V̇A-behoefte → hogere frequentie
    expect(f({ vaTarget: 8 })).toBeGreaterThan(f({ vaTarget: 5 }));
  });

  it("houdt V̇A exact gelijk in het optimum", () => {
    const otis = calcOtis(base);
    expect((otis.vtOpt - otis.vd) * otis.fOptHz * 60).toBeCloseTo(base.vaTarget, 10);
  });
});

describe("ademarbeid (Otis-criterium)", () => {
  it("elastisch en resistief werk komen overeen met numerieke integratie over de sinusoïdale inspiratie", () => {
    const fHz = 15 / 60;
    const vt = 0.45;
    const C = calcCompliance(base);
    const b = sineBreath(fHz, vt);
    const wob = calcWOB(base, fHz, vt);
    const elastic = integrate((t) => (b.volume(t) / C) * b.flow(t), 0, b.tInsp);
    const resistive = integrate((t) => base.resistance * b.flow(t) ** 2, 0, b.tInsp);

    expect(wob.elastic).toBeCloseTo(elastic * J, 8);
    expect(wob.resistive).toBeCloseTo(resistive * J, 8);
    expect(wob.perMinute).toBeCloseTo(wob.perBreath * 15, 12);
  });

  it("drempelwerk gebruikt de dynamische auto-PEEP van de ademteug", () => {
    const p = { ...base, resistance: 25, compliance: 60 };
    const fHz = 13 / 60;
    const vt = 0.55;
    expect(calcWOB(p, fHz, vt).intrinsic).toBeCloseTo(calcBreath(p, fHz, vt).autoPeep * vt * J, 12);
  });
});

describe("drukgecontroleerde ademteug", () => {
  it("levert in stationaire toestand precies het gevraagde VT en ingesloten volume (ODE-simulatie)", () => {
    for (const [p, fBpm, vt] of [
      [base, 15, 0.5],
      [{ ...base, resistance: 25, compliance: 60 }, 13, 0.55],
      [{ ...base, compliance: 25, resistance: 12 }, 25, 0.35],
    ] as const) {
      const breath = calcBreath(p, fBpm / 60, vt);
      const sim = simulatePcv(p, fBpm / 60, breath.deltaPinsp);
      expect(sim.vt).toBeCloseTo(vt, 3);
      expect(sim.trapped).toBeCloseTo(breath.trappedVolume, 3);
    }
  });

  it("gebruikt I:E 1:2 en geeft bij blokdruk en f = 20/τ auto-PEEP ≈ VT·e^(−2) / (1 − e^(−2)) / C", () => {
    const p = { ...base, pRamp: 0 };
    const tau = calcTau(p);
    const fHz = 20 / tau / 60;
    const vt = 0.5;
    const b = calcBreath(p, fHz, vt);
    expect(b.ti).toBeCloseTo(tau, 10);
    expect(b.te).toBeCloseTo(2 * tau, 10);
    const y = Math.exp(-2);
    const ideal = (vt * y) / (1 - y) / calcCompliance(p);
    // De korte klepafname (20 ms) laat iets minder expiratietijd over: iets meer auto-PEEP.
    expect(b.autoPeep).toBeGreaterThan(ideal);
    expect(b.autoPeep).toBeLessThan(ideal * 1.1);
  });

  it("zonder P-ramp is de inspiratiedruk constant en is de energie Pinsp·VT", () => {
    const p = { ...base, pRamp: 0 };
    const b = calcBreath(p, 15 / 60, 0.5);
    // Op de korte nastroom na Ti na (klepafname) is dit Pinsp·VT.
    expect(b.inspEnergy / (b.pinsp * 0.5)).toBeCloseTo(1, 3);
  });

  it("een langere P-ramp vraagt meer inspiratiedruk voor hetzelfde VT", () => {
    const pinsp = (pRamp: number) => calcBreath({ ...base, pRamp }, 15 / 60, 0.5).pinsp;
    expect(pinsp(200)).toBeGreaterThan(pinsp(50));
    expect(pinsp(50)).toBeGreaterThan(pinsp(0));
  });

  it("auto-PEEP verdwijnt bij ruime expiratietijd en neemt toe met de frequentie", () => {
    const vt = 0.5;
    expect(calcBreath(base, 5 / 60, vt).autoPeep).toBeLessThan(1e-3);
    expect(calcBreath(base, 30 / 60, vt).autoPeep).toBeGreaterThan(calcBreath(base, 20 / 60, vt).autoPeep);
  });

  it("Pinsp ligt boven de plateaudruk en driving pressure is VT/C", () => {
    const fHz = 30 / 60;
    const vt = 0.45;
    const prot = calcLungProtection(base, fHz, vt);
    expect(prot.peakPressure).toBeGreaterThan(prot.platPressure);
    expect(prot.drivingPressure).toBeCloseTo(vt / 0.05, 10);
    expect(prot.platPressure).toBeCloseTo(base.peep + prot.autoPeep + vt / 0.05, 10);
    expect(prot.totalPeep).toBeCloseTo(base.peep + prot.autoPeep, 12);
  });

  it("de druklimietlijn geeft precies Pinsp = Plimit", () => {
    for (const fBpm of [8, 15, 30]) {
      const vt = calcVtPressureLimitAtF(base, fBpm);
      expect(calcLungProtection(base, fBpm / 60, vt).peakPressure).toBeCloseTo(base.pLimit, 8);
    }
  });

  it("mechanisch vermogen is ∫Paw·dV over de inspiratie maal de frequentie", () => {
    const fBpm = 18;
    const vt = 0.45;
    const curves = generateTimeCurves(base, fBpm / 60, vt, 1, 20000);
    const ti = calcBreath(base, fBpm / 60, vt).ti;
    let energy = 0;
    for (let i = 1; i < curves.length; i++) {
      const a = curves[i - 1];
      const b = curves[i];
      if (a.t >= ti) break;
      energy += ((a.paw * a.flow + b.paw * b.flow) / 2 / 60) * (b.t - a.t); // flow L/min → L/s
    }
    expect(calcLungProtection(base, fBpm / 60, vt).mechPower).toBeCloseTo(energy * J * fBpm, 2);
  });

  it("tijdcurven zijn consistent: volume = ∫flow, sluiten na één cyclus en Paw = PEEP in expiratie", () => {
    const p = { ...base, resistance: 20, compliance: 60 };
    const fHz = 16 / 60;
    const vt = 0.5;
    const curves = generateTimeCurves(p, fHz, vt, 2, 4000);
    let v = 0;
    let maxErr = 0;
    for (let i = 1; i < curves.length; i++) {
      const dt = curves[i].t - curves[i - 1].t;
      v += (((curves[i].flow + curves[i - 1].flow) / 2) / 60) * dt * 1000; // mL
      maxErr = Math.max(maxErr, Math.abs(v - curves[i].volume));
    }
    expect(maxErr).toBeLessThan(1);
    expect(Math.max(...curves.map((c) => c.volume))).toBeCloseTo(vt * 1000, 0);
    expect(curves[curves.length - 1].volume).toBeCloseTo(0, 6);
    const ti = calcBreath(p, fHz, vt).ti;
    const expiration = curves.filter((c) => c.t > ti && c.t < 1 / fHz);
    expect(expiration.every((c) => c.paw >= p.peep - 1e-9)).toBe(true);
    expect(expiration[expiration.length - 1].paw).toBeCloseTo(p.peep, 6);
  });
});

describe("longbeschermingsscores", () => {
  it("geeft 50 punten op de grens en 100 ruim daaronder", () => {
    const prot = calcLungProtection(base, 15 / 60, 0.5);
    const scores = calcProtectionScores(base, { ...prot, drivingPressure: LIMITS.drivingPressure });
    expect(scores.find((s) => s.key === "dp")!.score).toBeCloseTo(50, 10);
    const low = calcProtectionScores(base, { ...prot, drivingPressure: 8 });
    expect(low.find((s) => s.key === "dp")!.score).toBe(100);
  });

  it("de iASV-score is het gemiddelde van de radarscores", () => {
    const d = calcIASV(base);
    const prot = calcLungProtection(base, d.fActual / 60, d.vtActual);
    const scores = calcProtectionScores(base, prot);
    expect(d.protectionScore).toBeCloseTo(scores.reduce((s, x) => s + x.score, 0) / scores.length, 10);
  });
});

describe("iASV-werkpunt", () => {
  it("kiest het Otis-optimum als dat binnen alle limieten valt", () => {
    const d = calcIASV(base);
    expect(d.constrained).toBe(false);
    expect(d.feasible).toBe(true);
    expect(d.fActual).toBeCloseTo(d.fOtis, 10);
    expect(d.vtActual).toBeCloseTo(d.vtOtis, 10);
  });

  it("rapporteert het ASV-frequentievenster f ≤ 20/τ", () => {
    expect(calcFrequencyWindow(base)).toEqual({ fMinBpm: 5, fMaxBpm: 40 });
    expect(calcFrequencyWindow({ ...base, compliance: 10, resistance: 5 }).fMaxBpm).toBe(60);
  });

  it("beperkt VT bij een stijve long en verhoogt f om V̇A te behouden", () => {
    const p = { ...base, compliance: 25, peep: 12 };
    const d = calcIASV(p);
    const prot = calcLungProtection(p, d.fActual / 60, d.vtActual);
    expect(d.constrained).toBe(true);
    expect(d.fActual).toBeGreaterThan(d.fOtis);
    expect(prot.drivingPressure).toBeLessThanOrEqual(LIMITS.drivingPressure + 1e-6);
    expect(d.limitingFactor).toMatch(/Driving pressure|Plateaudruk|Druk limiet/);
  });

  it("past de Pinsp-grens toe op de werkelijk gekozen frequentie", () => {
    const p = { ...base, resistance: 15, compliance: 40, pLimit: 18 };
    const d = calcIASV(p);
    const prot = calcLungProtection(p, d.fActual / 60, d.vtActual);
    expect(d.feasible).toBe(true);
    expect(d.limitingFactor).toMatch(/Druk limiet/);
    expect(prot.peakPressure).toBeCloseTo(p.pLimit, 4);
    expect(prot.peakPressure).toBeLessThanOrEqual(p.pLimit + 1e-6);
  });

  it("geeft een eindig resultaat en meldt het als geen veilig werkpunt bestaat", () => {
    // C = 20 mL/cmH₂O: al bij VT_min = 2·VD is ΔP > 15
    const d = calcIASV({ ...base, compliance: 20 });
    expect(d.feasible).toBe(false);
    expect(d.limitingFactor).toMatch(/^Geen veilig werkpunt/);
    expect(Number.isFinite(d.fActual)).toBe(true);
    expect(Number.isFinite(d.vtActual)).toBe(true);
    expect(d.fActual).toBeGreaterThanOrEqual(d.fMinBpm);
    expect(d.fActual).toBeLessThanOrEqual(d.fMaxBpm);
  });

  it("respecteert alle limieten, behoudt V̇A en blijft zo dicht mogelijk bij f_Otis (parametersweep)", () => {
    const rand = rng(7);
    for (let i = 0; i < 1000; i++) {
      const p = randomParams(rand);
      const d = calcIASV(p);
      const vd = calcDeadSpace(p);

      expect(Number.isFinite(d.fActual) && Number.isFinite(d.vtActual)).toBe(true);
      expect((d.vtActual - vd) * d.fActual).toBeCloseTo(p.vaTarget, 8);
      if (!d.feasible) continue;

      const prot = calcLungProtection(p, d.fActual / 60, d.vtActual);
      const tol = 1e-6;
      expect(d.fActual).toBeGreaterThanOrEqual(d.fMinBpm - tol);
      expect(d.fActual).toBeLessThanOrEqual(d.fMaxBpm + tol);
      expect(d.vtActual).toBeGreaterThanOrEqual(d.vtMin - tol);
      expect(prot.peakPressure).toBeLessThanOrEqual(p.pLimit + tol);
      expect(prot.drivingPressure).toBeLessThanOrEqual(LIMITS.drivingPressure + tol);
      expect(prot.platPressure).toBeLessThanOrEqual(LIMITS.platPressure + tol);
      expect(prot.vtPerKg).toBeLessThanOrEqual(LIMITS.vtPerKg + tol);

      // Een stap richting f_Otis moet een limiet schenden (anders was dat punt gekozen).
      if (d.constrained) {
        expect(d.limitingFactor.length).toBeGreaterThan(0);
        const fCloser = d.fActual + Math.sign(d.fOtis - d.fActual) * 0.02;
        const vtCloser = p.vaTarget / 60 / (fCloser / 60) + vd;
        const pc = calcLungProtection(p, fCloser / 60, vtCloser);
        const violates =
          fCloser < d.fMinBpm || fCloser > d.fMaxBpm || vtCloser < d.vtMin ||
          pc.peakPressure > p.pLimit || pc.drivingPressure > LIMITS.drivingPressure ||
          pc.platPressure > LIMITS.platPressure || pc.vtPerKg > LIMITS.vtPerKg;
        expect(violates).toBe(true);
      }
    }
  });
});

describe("gemeten PEEPi (expiratoire hold)", () => {
  const fHz = 15 / 60;
  const vt = 0.5;

  it("heeft geen effect als de gemeten waarde onder de modelvoorspelling ligt", () => {
    const p = { ...base, resistance: 25, compliance: 60 };
    const model = calcBreath(p, 13 / 60, 0.55);
    const measured = calcBreath({ ...p, peepiMeasured: model.autoPeepModel * 0.5 }, 13 / 60, 0.55);
    expect(measured.autoPeep).toBeCloseTo(model.autoPeep, 12);
    expect(measured.pinsp).toBeCloseTo(model.pinsp, 12);
    expect(measured.flowLimitedPeep).toBe(0);
  });

  it("gebruikt de gemeten waarde als die hoger is en verhoogt Pplat en Pinsp met het verschil", () => {
    const ref = calcLungProtection(base, fHz, vt);
    const p = { ...base, peepiMeasured: 6 };
    const prot = calcLungProtection(p, fHz, vt);
    const breath = calcBreath(p, fHz, vt);
    expect(prot.autoPeep).toBeCloseTo(6, 10);
    expect(breath.flowLimitedPeep).toBeCloseTo(6 - breath.autoPeepModel, 10);
    expect(prot.platPressure - ref.platPressure).toBeCloseTo(breath.flowLimitedPeep, 10);
    expect(prot.peakPressure - ref.peakPressure).toBeCloseTo(breath.flowLimitedPeep, 10);
    expect(prot.drivingPressure).toBeCloseTo(ref.drivingPressure, 12);
    expect(calcWOB(p, fHz, vt).intrinsic).toBeCloseTo(6 * vt * J, 10);
  });

  it("kan de iASV-keuze beperken via de plateaudruk", () => {
    const p = { ...base, compliance: 35, peep: 10 };
    const without = calcIASV(p);
    const withPeepi = calcIASV({ ...p, peepiMeasured: 8 });
    expect(withPeepi.vtActual).toBeLessThan(without.vtActual);
    expect(withPeepi.limitingFactor).toMatch(/Plateaudruk|Druk limiet/);
  });

  it("de curven tonen de verhoogde alveolaire basisdruk; Paw keert terug naar PEEP", () => {
    const p = { ...base, peepiMeasured: 6 };
    const curves = generateTimeCurves(p, fHz, vt, 1, 2000);
    const last = curves[curves.length - 1];
    expect(last.palv).toBeCloseTo(base.peep + 6, 3);
    expect(last.paw).toBeCloseTo(base.peep, 6);
  });
});

describe("spontane ademhaling", () => {
  it("is passief zonder eigen frequentie: gemeten punt = doel", () => {
    const d = calcIASV(base);
    expect(d.measured.spontaneous).toBe(false);
    expect(d.measured.fBpm).toBeCloseTo(d.fActual, 12);
    expect(d.measured.vt).toBeCloseTo(d.vtActual, 12);
    expect(d.measured.mandatoryBpm).toBeCloseTo(d.fActual, 12);
  });

  it("vult aan met verplichte teugen als de patiënt langzamer ademt dan het doel", () => {
    const d = calcIASV({ ...base, fSpont: 8 });
    expect(d.measured.spontaneous).toBe(false);
    expect(d.measured.fBpm).toBeCloseTo(d.fActual, 12);
    expect(d.measured.mandatoryBpm).toBeCloseTo(d.fActual - 8, 12);
  });

  it("houdt het minuutvolume vast als de patiënt sneller ademt; V̇A daalt", () => {
    const d = calcIASV({ ...base, fSpont: 30 });
    expect(d.measured.spontaneous).toBe(true);
    expect(d.measured.fBpm).toBe(30);
    expect(d.measured.mandatoryBpm).toBe(0);
    expect(d.measured.vt * d.measured.fBpm).toBeCloseTo(d.minuteVolume, 10);
    expect(d.measured.vt).toBeLessThan(d.vtActual);
    expect(d.measured.alveolarVentilation).toBeLessThan(base.vaTarget);
    // Het doel zelf verandert niet door de eigen ademactiviteit
    expect(d.fActual).toBeCloseTo(calcIASV(base).fActual, 12);
  });
});
