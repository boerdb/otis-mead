import { describe, it, expect } from "vitest";
import {
  LIMITS,
  calcCompliance,
  calcDeadSpace,
  calcFrequencyWindow,
  calcIASV,
  calcLungProtection,
  calcOtis,
  calcTau,
  calcWOB,
} from "./calculations";
import type { VentilatorParams } from "./types";

const base: VentilatorParams = {
  peep: 5,
  autoPeep: 0,
  pLimit: 30,
  resistance: 10,
  compliance: 50,
  ibw: 70,
  vaTarget: 5,
};

const J = 0.0980665;

/** Numerieke integratie (Simpson) van g over [a, b]. */
function integrate(g: (x: number) => number, a: number, b: number, n = 2000): number {
  const h = (b - a) / n;
  let sum = g(a) + g(b);
  for (let i = 1; i < n; i++) sum += g(a + i * h) * (i % 2 ? 4 : 2);
  return (sum * h) / 3;
}

/** Sinusoïdale inspiratie: volume, flow en druk op tijdstip t ∈ [0, 1/(2f)]. */
function sineBreath(p: VentilatorParams, fHz: number, vt: number) {
  const C = calcCompliance(p);
  const peepTot = p.peep + p.autoPeep;
  const volume = (t: number) => (vt / 2) * (1 - Math.cos(2 * Math.PI * fHz * t));
  const flow = (t: number) => Math.PI * fHz * vt * Math.sin(2 * Math.PI * fHz * t);
  const pressure = (t: number) => peepTot + volume(t) / C + p.resistance * flow(t);
  return { volume, flow, pressure, tInsp: 1 / (2 * fHz) };
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
    autoPeep: rand() * 15,
    pLimit: 15 + rand() * 35,
    resistance: 2 + rand() * 28,
    compliance: 10 + rand() * 110,
    ibw: 40 + rand() * 80,
    vaTarget: 2 + rand() * 10,
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
      const p = { ...randomParams(rand), autoPeep: 0 };
      const vd = calcDeadSpace(p);
      const VA = p.vaTarget / 60;
      const wobAt = (fBpm: number) => calcWOB(p, fBpm / 60, VA / (fBpm / 60) + vd).perMinute;

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

describe("ademarbeid en drukken", () => {
  const p = { ...base, autoPeep: 3 };
  const fHz = 15 / 60;
  const vt = 0.45;
  const breath = sineBreath(p, fHz, vt);

  it("elastisch en resistief werk komen overeen met numerieke integratie over de inspiratie", () => {
    const C = calcCompliance(p);
    const wob = calcWOB(p, fHz, vt);
    const elastic = integrate((t) => (breath.volume(t) / C) * breath.flow(t), 0, breath.tInsp);
    const resistive = integrate((t) => p.resistance * breath.flow(t) ** 2, 0, breath.tInsp);

    expect(wob.elastic).toBeCloseTo(elastic * J, 8);
    expect(wob.resistive).toBeCloseTo(resistive * J, 8);
    expect(wob.intrinsic).toBeCloseTo(p.autoPeep * vt * J, 12);
    expect(wob.perMinute).toBeCloseTo(wob.perBreath * 15, 12);
  });

  it("piekdruk is het werkelijke maximum van de sinusoïdale drukcurve", () => {
    let max = -Infinity;
    for (let i = 0; i <= 100000; i++) max = Math.max(max, breath.pressure((i / 100000) * breath.tInsp));
    const prot = calcLungProtection(p, fHz, vt);
    expect(prot.peakPressure).toBeCloseTo(max, 6);
    expect(prot.peakPressure).toBeLessThan(prot.platPressure + p.resistance * Math.PI * fHz * vt);
  });

  it("plateau- en driving pressure volgen uit VT/C", () => {
    const prot = calcLungProtection(p, fHz, vt);
    expect(prot.drivingPressure).toBeCloseTo(vt / 0.05, 10);
    expect(prot.platPressure).toBeCloseTo(p.peep + p.autoPeep + vt / 0.05, 10);
    expect(prot.vtPerKg).toBeCloseTo(450 / 70, 10);
  });

  it("mechanisch vermogen is de energie ∫P·dV per inspiratie maal de frequentie", () => {
    const energy = integrate((t) => breath.pressure(t) * breath.flow(t), 0, breath.tInsp);
    expect(calcLungProtection(p, fHz, vt).mechPower).toBeCloseTo(energy * J * 15, 6);
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

  it("past de Ppeak-grens toe op de werkelijk gekozen frequentie", () => {
    const p = { ...base, resistance: 25, compliance: 40, pLimit: 22 };
    const d = calcIASV(p);
    const prot = calcLungProtection(p, d.fActual / 60, d.vtActual);
    expect(d.feasible).toBe(true);
    expect(prot.peakPressure).toBeLessThanOrEqual(p.pLimit + 1e-6);
  });

  it("geeft een eindig resultaat en meldt het als geen veilig werkpunt bestaat", () => {
    const d = calcIASV({ ...base, peep: 20, autoPeep: 15, pLimit: 30 });
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
