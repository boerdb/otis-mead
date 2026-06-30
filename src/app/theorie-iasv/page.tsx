import type { Metadata } from "next";
import Link from "next/link";
import PrintTheoryButton from "@/components/PrintTheoryButton";

export const metadata: Metadata = {
  title: "iASV Theorie - Otis en Mead",
  description:
    "Uitgebreide theoretische uitleg van iASV met Otis- en Mead-formules en interpretatie van alle termen.",
};

const symbolRows = [
  { sym: "f", unit: "1/s of bpm", desc: "Ademfrequentie. In de vergelijkingen vaak in Hz (1/s), op de monitor meestal in bpm." },
  { sym: "VT", unit: "L", desc: "Tidal volume per ademteug." },
  { sym: "VdotA", unit: "L/min of L/s", desc: "Alveolaire ventilatie (effectieve ventilatie na aftrek van dode ruimte)." },
  { sym: "VD", unit: "L", desc: "Fysiologische dode ruimte per adem." },
  { sym: "R", unit: "cmH2O*s/L", desc: "Luchtwegweerstand." },
  { sym: "C", unit: "L/cmH2O", desc: "Compliance van het respiratoire systeem." },
  { sym: "tau", unit: "s", desc: "Tijdconstante, met tau = R*C." },
  { sym: "PEEPi", unit: "cmH2O", desc: "Intrinsic PEEP (auto-PEEP)." },
  { sym: "Ppeak", unit: "cmH2O", desc: "Piekdruk tijdens inspiratie." },
  { sym: "DeltaP", unit: "cmH2O", desc: "Driving pressure, met DeltaP = VT/C." },
];

const otisRows = [
  {
    formula: "2*pi^2*tau*f^2 + f - VdotA/VD = 0",
    explain:
      "Dit is de Otis-voorwaarde voor minimale arbeid per minuut bij vaste alveolaire ventilatie. De term met f^2 representeert de dynamische kosten van snellere ademhaling in een systeem met tijdconstante tau.",
  },
  {
    formula: "f_opt = (-1 + sqrt(1 + 8*pi^2*tau*(VdotA/VD))) / (4*pi^2*tau)",
    explain:
      "Gesloten vorm van de positieve wortel. Hiermee bereken je direct de theoretisch optimale frequentie (in Hz).",
  },
  {
    formula: "VT = VdotA/f + VD",
    explain:
      "Als f bekend is, volgt VT uit de ventilatiebalans. Lagere f vraagt hoger VT om dezelfde VdotA te halen.",
  },
];

const meadRows = [
  {
    formula: "W_el = VT^2/(2*C)",
    explain:
      "Elastisch werk: energie om long en thorax op te rekken. Stijgt kwadratisch met VT.",
  },
  {
    formula: "W_res = (pi^2*R*f*VT^2)/2",
    explain:
      "Resistief werk: energieverlies door stroming door luchtwegen en circuit. Neemt toe met R, f en VT^2.",
  },
  {
    formula: "W_iPEEP = PEEPi*VT",
    explain:
      "Extra drempelwerk om intrinsic PEEP te overwinnen voordat luchtinstroom effectief wordt.",
  },
  {
    formula: "W_tot = W_el + W_res + W_iPEEP",
    explain:
      "Totale arbeid per adem; per minuut vermenigvuldigd met f*60.",
  },
];

const iasvSteps = [
  "Bepaal een theoretisch optimaal werkpunt met Otis: f_opt en VT_opt.",
  "Bereken veiligheidsgrenzen voor maximaal toelaatbaar VT op basis van druk, driving pressure, VT/kg en plateaudruk.",
  "Kies het laagste van die VT-limieten als VT_ceiling.",
  "Als VT_opt groter is dan VT_ceiling, verlaag VT naar VT_ceiling en verhoog f om VdotA te behouden.",
  "Rapporteer welke grens dominant werd (de beperkende factor) en toon de gevolgen voor WOB en longbescherming.",
];

export default function TheoryIASVPage() {
  return (
    <div className="iasv-print-page min-h-screen bg-gray-950 text-gray-100">
      <header className="iasv-screen-header border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <h1 className="text-sm md:text-base font-semibold tracking-wide text-sky-300">
            iASV Theoriecentrum
          </h1>
          <div className="flex items-center gap-3">
            <PrintTheoryButton />
            <Link
              href="/"
              className="text-xs md:text-sm text-gray-300 hover:text-white transition-colors"
            >
              Terug naar simulator
            </Link>
          </div>
        </div>
      </header>

      <main className="iasv-print-main max-w-6xl mx-auto px-6 py-8 space-y-8">
        <section className="iasv-print-section bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Waarom iASV bestaat</h2>
          <p className="text-sm text-gray-300 leading-7">
            Intelligent Adaptive Support Ventilation (iASV) probeert een stabiele alveolaire ventilatie te
            leveren met zo min mogelijk ademarbeid en binnen longbeschermende grenzen. In plaats van een
            vaste frequentie of vast teugvolume te forceren, vertrekt iASV vanuit een fysiologisch optimum
            en corrigeert dat optimum daarna op basis van veiligheidslimieten.
          </p>
          <p className="text-sm text-gray-300 leading-7">
            Conceptueel gebeurt er dus altijd een tweestapsbeslissing: eerst efficiency (Otis/Mead), daarna
            safety (druk, VT/kg, driving pressure, mechanische belasting).
          </p>
        </section>

        <section className="iasv-print-section bg-gray-900 border border-gray-700 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Symbolen en eenheden</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700">
                  <th className="py-2 pr-4">Symbool</th>
                  <th className="py-2 pr-4">Eenheid</th>
                  <th className="py-2">Betekenis</th>
                </tr>
              </thead>
              <tbody>
                {symbolRows.map((row) => (
                  <tr key={row.sym} className="border-b border-gray-800 align-top">
                    <td className="py-2 pr-4 font-mono text-sky-300">{row.sym}</td>
                    <td className="py-2 pr-4 text-gray-300">{row.unit}</td>
                    <td className="py-2 text-gray-300">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="iasv-print-section bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Otis-principe: optimale frequentie</h2>
          <p className="text-sm text-gray-300 leading-7">
            Otis liet zien dat er bij een gegeven ventilatiebehoefte een frequentie bestaat waarbij de totale
            ademarbeid per minuut minimaal is. Die optimumfrequentie verschuift bij veranderingen in dode
            ruimte, weerstand en tijdconstante.
          </p>
          <div className="space-y-3">
            {otisRows.map((item) => (
              <div key={item.formula} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <p className="text-xs md:text-sm font-mono text-yellow-300 break-words">{item.formula}</p>
                <p className="text-sm text-gray-300 mt-2 leading-7">{item.explain}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-300 leading-7">
            Klinische interpretatie: als weerstand stijgt of expiratie trager wordt (hogere tau), dan wordt
            hoge frequentie energetisch duurder en verschuift het optimum richting lagere f met relatief
            hoger VT. iASV neemt dit mee, maar begrenst vervolgens op longbescherming.
          </p>
        </section>

        <section className="iasv-print-section bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Mead-principe: opbouw van ademarbeid</h2>
          <p className="text-sm text-gray-300 leading-7">
            Waar Otis het optimum beschrijft, splitst Mead de ademarbeid op in componenten. Dat maakt duidelijk
            waarom een wijziging in VT of f niet neutraal is: elastische en resistieve kosten reageren anders.
          </p>
          <div className="space-y-3">
            {meadRows.map((item) => (
              <div key={item.formula} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <p className="text-xs md:text-sm font-mono text-cyan-300 break-words">{item.formula}</p>
                <p className="text-sm text-gray-300 mt-2 leading-7">{item.explain}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-300 leading-7">
            Praktisch betekent dit: een strategie met zeer hoog VT kan elastisch duur worden, terwijl zeer hoge
            frequentie resistief duur wordt. iASV zoekt de balans en voorkomt tegelijk overdruk of overdistensie.
          </p>
        </section>

        <section className="iasv-print-section bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Van theorie naar iASV-beslislogica</h2>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-300 leading-7">
            {iasvSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Typische limietformules</p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="font-mono text-pink-300">Ppeak = PEEP_tot + VT/C + R*pi*f*VT</li>
              <li className="font-mono text-pink-300">DeltaP = VT/C</li>
              <li className="font-mono text-pink-300">VT/kg = (VT*1000)/IBW</li>
              <li className="font-mono text-pink-300">Pplat = PEEP_tot + VT/C</li>
            </ul>
            <p className="text-sm text-gray-300 mt-3 leading-7">
              iASV berekent voor elke grens een maximaal toelaatbaar VT en kiest de strengste grens als actieve
              limiter. Dat maakt het algoritme transparant en uitlegbaar aan het bed.
            </p>
          </div>
        </section>

        <section className="iasv-print-section bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Hoe je dit in kort kunt samenvatten</h2>
          <p className="text-sm text-gray-300 leading-7">
            iASV is geen black box die zomaar een frequentie kiest. Het is een gecontroleerde optimalisatie:
            eerst een energetisch optimum op basis van klassieke fysiologie, daarna begrenzing op
            longbeschermende veiligheidsregels. Als de patiëntmechanica verandert, verschuift het optimum mee,
            maar veiligheidslimieten blijven hard bewaakt.
          </p>
          <p className="text-sm text-gray-300 leading-7">
            In discussies helpt de zin: "Otis bepaalt waar het efficiënt is, Mead verklaart waarom, en iASV beslist
            pas definitief nadat alle safety-limieten zijn toegepast."
          </p>
        </section>
      </main>
    </div>
  );
}
