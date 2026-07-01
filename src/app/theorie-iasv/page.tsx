import type { Metadata } from "next";
import Link from "next/link";
import PrintTheoryButton from "@/components/PrintTheoryButton";

export const metadata: Metadata = {
  title: "iASV-theorie - uitgebreide referentie",
  description:
    "Uitgebreide theoretische referentie voor iASV met Otis- en Mead-context, biologische mechanica, wiskundige afleidingen, klinische onderbouwing, geavanceerde onderwerpen en beperkingen.",
};

const symbolRows = [
  { sym: "f", unit: "1/s of bpm", desc: "Ademfrequentie. In vergelijkingen als Hz (1/s), op monitor als bpm. Fysiologisch bereik 5-50 bpm." },
  { sym: "VT", unit: "L", desc: "Teugvolume per ademteug. Ongeveer 6-8 mL/kg IBW in beschermende ventilatie." },
  { sym: "VdotA", unit: "L/min of L/s", desc: "Alveolaire ventilatie: effectieve ventilatie na dode ruimte. VdotA = (VT - VD) × f." },
  { sym: "VD", unit: "L", desc: "Fysiologische dode ruimte. Ongeveer 0.15 L × (lichaamgewicht in kg)/70 of 2 mL/kg." },
  { sym: "VDanat", unit: "L", desc: "Anatomische dode ruimte (airways tot terminale bronchioli): ~150 mL." },
  { sym: "VDalv", unit: "L", desc: "Alveolaire dode ruimte (ventilatie zonder perfusie, V/Q>>1)." },
  { sym: "R", unit: "cmH2O·s/L", desc: "Luchtwegweerstand. Normaal 5-10, ARDS 15-30+. Sterk stromingsafhankelijk, niet-lineair bij hoge stroming." },
  { sym: "C", unit: "L/cmH2O", desc: "Totale compliance (long + thorax). ARDS 20-50 mL/cmH2O. 1/C_tot = 1/C_long + 1/C_thorax." },
  { sym: "Cstat", unit: "L/cmH2O", desc: "Statische compliance (zonder stroming): (VT)/(Pplat - PEEP)." },
  { sym: "Cdyn", unit: "L/cmH2O", desc: "Dynamische compliance (met stroming): (VT)/(Ppeak - PEEP). Cdyn &lt; Cstat bij obstructie." },
  { sym: "tau", unit: "s", desc: "Tijdconstante: tau = R × C. Bepaalt vulling/lediging snelheid (95% in ~3×tau)." },
  { sym: "PEEPe", unit: "cmH2O", desc: "Extrinsic PEEP: ventilator-ingesteld PEEP." },
  { sym: "PEEPi", unit: "cmH2O", desc: "Intrinsic PEEP (auto-PEEP): luchtval. Treedt op als expiratie onvoldoende lang." },
  { sym: "PEEP_tot", unit: "cmH2O", desc: "Totale PEEP: PEEPe + PEEPi. Bepaalt startniveau elastische rekking." },
  { sym: "Ppeak", unit: "cmH2O", desc: "Piekdruk (start expiratie): stuwkracht voor stroming. ARDS <30 cmH2O aanbevolen." },
  { sym: "Pplat", unit: "cmH2O", desc: "Plateaudruk (end-inspiratie, geen stroming): zuiver elastisch. ARDS <30 cmH2O target." },
  { sym: "DeltaP", unit: "cmH2O", desc: "Driving pressure = Pplat - PEEP_tot = VT/C. Prognostisch belangrijker dan Pplat." },
  { sym: "IBW", unit: "kg", desc: "Ideaal lichaamgewicht. Mannen: 50 + 2.3×(lengte in inches - 60); Vrouwen: 45.5 + 2.3×(lengte in inches - 60)." },
  { sym: "W_el", unit: "J", desc: "Elastisch werk: (1/2) × VT² / C. Overdruk- en overdistensie-gerelateerd." },
  { sym: "W_res", unit: "J", desc: "Resistief werk: (π²/2) × R × f × VT². Sterk afhankelijk van stroming." },
  { sym: "W_iPEEP", unit: "J", desc: "Drempelwerk auto-PEEP: PEEPi × VT. Moet eerst overwonnen voordat inspiratie start." },
  { sym: "W_tot", unit: "J/min", desc: "Totale ademarbeid per minuut: f × 60 × (W_el + W_res + W_iPEEP)." },
];

const otisRows = [
  {
    formula: "2·π²·τ·f² + f - V̇A/VD = 0",
    explain:
      "Originele Otis-voorwaarde (1950) voor minimale ademarbeid per minuut bij vaste V̇A. Dit is een kwadratische vergelijking in f. De π²·τ·f²-term domineert bij hoge f en lage τ; de f-term (uit resistief werk) en constant (uit elastisch) bepalen het evenwicht.",
  },
  {
    formula: "f_opt = (−1 + √(1 + 8π²τ·(V̇A/VD))) / (4π²τ)",
    explain:
      "Gesloten oplossing; de positieve wortel van Otis' vergelijking. Dit geeft direct f_opt in Hz. Merk op: als τ↑ (langzame long) dan f_opt↓; als V̇A/VD↑ dan f_opt↑.",
  },
  {
    formula: "VT_opt = V̇A/f_opt + VD",
    explain:
      "Zodra f_opt bekend is, volgt VT_opt uit behoud van alveolaire ventilatie. Lagere f leidt tot hoger VT voor dezelfde V̇A.",
  },
  {
    formula: "W_tot(f) = W_el(f) + W_res(f) + W_iPEEP(f) [per minuut vermenigvuldigd met f·60]",
    explain:
      "Totale ademarbeid als functie van f. Dit is wat Otis minimaliseerde. In ARDS met hoge auto-PEEP kan W_iPEEP dominant worden.",
  },
];

const meadRows = [
  {
    formula: "W_el = VT² / (2·C)",
    explain:
      "Elastisch werk per adem: proportioneelmet VT². Stijgt kwadratisch! Dit verklaart waarom zeer hoog VT energetisch duur is. In ARDS met lage C wordt dit snel dominant.",
  },
  {
    formula: "W_res = (π²·R·f·VT²) / 2",
    explain:
      "Resistief werk: ook kwadratisch in VT. Stijgt lineair met f en R. Hoge frequentie + hoge weerstand = zeer duur.",
  },
  {
    formula: "W_iPEEP = PEEPi·VT",
    explain:
      "Drempelwerk: moet eerst intrinsic PEEP overwinnen. Lineair in beide PEEPi en VT. Vaak onderschat in ARDS/COPD.",
  },
  {
    formula: "W_tot = W_el + W_res + W_iPEEP (per adem)",
    explain:
      "Totale werk per adem. Per minuut: f·60·W_tot. Dit is wat Otis + Mead samen beschrijven.",
  },
  {
    formula: "dW_tot/dVT = VT/C + π²·R·f·VT = 0 [voor optimum]",
    explain:
      "Differentiaalanalyse: elastisch en resistief werk moeten elkaar balanceren. Dit is Mead's redenering.",
  },
];

const iasvSteps = [
  "Bepaal theoretisch optimaal werkpunt met Otis: f_opt en VT_opt.",
  "Bereken veiligheidsgrenzen: Ppeak, Pplat, ΔP, VT/kg, PEEPi, etc.",
  "Bepaal VT_ceiling = minimum van alle veiligheidslimieten.",
  "Als VT_opt &gt; VT_ceiling: pas VT aan naar VT_ceiling, corrigeer f om V̇A constant te houden.",
  "Rapporteer dominante limiter, energetische kosten en longbeschermingsstatus.",
];

export default function TheoryIASVPage() {
  return (
    <div className="iasv-print-page min-h-screen bg-gray-950 text-gray-100">
      <header className="iasv-screen-header border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            <h1 className="text-sm md:text-base font-semibold tracking-wide text-sky-300">
            iASV-theoriecentrum — uitgebreide referentie
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
          <h2 className="text-xl font-semibold text-white">Inleiding: waarom iASV bestaat</h2>
          <p className="text-sm text-gray-300 leading-7">
            Intelligent Adaptive Support Ventilation (iASV) combineert twee grote fysiologische inzichten: (1) energetische optimalisatie via Otis' klassieke werk uit 1950, en (2) het meenemen van longbeschermende veiligheidslimieten die sinds ARDS-netwerkstudies centraal staan. In plaats van vaste frequenties of volumes op te leggen, probeert iASV een dynamisch, adaptief werkpunt te vinden dat beide criteria respecteert.
          </p>
          <p className="text-sm text-gray-300 leading-7">
            De centrale boodschap: <span className="text-yellow-300">normale longfysiologie bepaalt hoe de patiënt efficiënt ademt, maar bij kritieke ziekte moeten daar veiligheidslimieten omheen worden gezet</span>. iASV is daarin transparant: eerst het optimum bepalen, daarna begrenzen.
          </p>
        </section>

        {/* HISTORISCHE CONTEXT */}
        <section className="iasv-print-section bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Historische achtergrond: Otis, Mead en de mechanica van de ademhaling</h2>
          <div className="space-y-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <h3 className="text-base font-semibold text-sky-300 mb-2">Charles Otis (1915–1993) en het optimale ventilatiemechanisme</h3>
              <p className="text-sm text-gray-300 leading-7">
                Charles Otis werkte in het Walter Reed Army Hospital en bestudeerde de arbeidsfysiologie van de ademhaling. Zijn baanbrekende werk uit 1950 liet zien dat voor een gegeven metabole behoefte (V̇A) een <span className="text-yellow-300">optimale ademfrequentie</span> bestaat waarbij de totale ademarbeid minimaal is. Dat was revolutionair: ademhaling bleek niet willekeurig, maar het resultaat van een energetisch optimalisatieprobleem.
              </p>
              <p className="text-sm text-gray-300 leading-7 mt-2">
                Otis' kerninzicht: <span className="text-yellow-300">sneller ademen (hoog f, laag VT)</span> kost veel energie door resistief werk, maar <span className="text-yellow-300">langzamer ademen (laag f, hoog VT)</span> kost juist veel energie door elastisch werk. Er bestaat dus een evenwicht, en dat hangt af van de longmechanica (compliance, weerstand en dode ruimte).
              </p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <h3 className="text-base font-semibold text-cyan-300 mb-2">John Mead (1927–2001) en het ontleden van ademarbeid</h3>
              <p className="text-sm text-gray-300 leading-7">
                John Mead, een fysioloog aan Harvard, bouwde voort op Otis' werk. In plaats van de totale energie te bekijken, splitste Mead de ademarbeid op in componenten: <span className="text-yellow-300">elastisch werk, resistief werk en drempelwerk</span>. Dat leverde klinische inzichten op, bijvoorbeeld dat ARDS met lage compliance het elastische werk sterk verhoogt en dat obstructieve pathologie het resistieve werk doet toenemen.
              </p>
              <p className="text-sm text-gray-300 leading-7 mt-2">
                Mead's bijdrage maakte het mogelijk om beter te begrijpen <span className="text-yellow-300">waarom</span> bepaalde ventilatorinstellingen anders uitpakken. Zijn werk legde de basis voor moderne work-of-breathing (WOB)-metingen en concepten zoals "compliance penalty" en "resistance penalty".
              </p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <h3 className="text-base font-semibold text-green-300 mb-2">Van klassieke fysiologie naar moderne ARDS-era</h3>
              <p className="text-sm text-gray-300 leading-7">
                Tot ongeveer 1990 lag de nadruk vooral op energetische efficiëntie. Daarna veranderde het denken radicaal: ARDSnet (Acute Respiratory Distress Syndrome Network) toonde in een baanbrekende trial in 2000 aan dat lage-tidal-volumeventilatie (6 mL/kg IBW) in vergelijking met 12 mL/kg de sterfte met 22% verlaagde. Daarmee begon de era van <span className="text-yellow-300">longbeschermende ventilatie</span>.
              </p>
              <p className="text-sm text-gray-300 leading-7 mt-2">
                Daarna volgden de inzichten elkaar snel op: driving pressure als prognostische factor (Amato et al. 2015), auto-PEEP als verborgen vijand, heterogene ventilatie en cycli van recruitment en derecruitment. Modern ventilatormanagement is dus: <span className="text-yellow-300">energetische efficiëntie UIT, veiligheid EERST</span>.
              </p>
            </div>
          </div>
        </section>

        <section className="iasv-print-section bg-gray-900 border border-gray-700 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Symbolen, Eenheden en Definities</h2>
          <p className="text-xs text-gray-400 mb-4">Uitgebreide tabel met fysiologische en klinische parameters</p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs md:text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700 bg-gray-800">
                  <th className="py-2 px-3 font-semibold">Symbool</th>
                  <th className="py-2 px-3 font-semibold">Eenheid</th>
                  <th className="py-2 px-3 font-semibold">Beschrijving & Context</th>
                </tr>
              </thead>
              <tbody>
                {symbolRows.map((row) => (
                  <tr key={row.sym} className="border-b border-gray-800 align-top hover:bg-gray-800/50">
                    <td className="py-2 px-3 font-mono text-sky-300">{row.sym}</td>
                    <td className="py-2 px-3 text-gray-400 font-mono text-xs">{row.unit}</td>
                    <td className="py-2 px-3 text-gray-300">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* OTIS SECTIE */}
        <section className="iasv-print-section bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Otis-principe: energetische optimalisatie van frequentie en volume</h2>
          
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-yellow-300 mb-2">Het kernprobleem</h3>
            <p className="text-sm text-gray-300 leading-7">
              Stel: een patiënt heeft een vastgestelde metabole behoefte (V̇A = 4 L/min). Die V̇A kan bereikt worden via oneindig veel combinaties van f en VT:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-300 mt-2">
              <li>f=10 bpm, VT=500 mL (langzaam, diep)</li>
              <li>f=20 bpm, VT=250 mL (normaal)</li>
              <li>f=40 bpm, VT=125 mL (snel, ondiep)</li>
            </ul>
            <p className="text-sm text-gray-300 leading-7 mt-2">
              Welke combinatie kost de minste <span className="text-yellow-300">energie</span> (work-of-breathing)? Otis' antwoord: er bestaat een <span className="text-yellow-300">optimaal punt</span>, en dat hangt af van de longmechanica (R, C, τ en VD).
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-yellow-300 mb-2">Wiskundige Afleiding</h3>
            <p className="text-sm text-gray-300 leading-7 mb-2">Otis hanteerde een energiebenadering:</p>
            <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs text-cyan-300 space-y-1 overflow-x-auto">
              <p>W_tot (per minuut) = f·60·[W_el(VT) + W_res(f,VT) + W_iPEEP(VT)]</p>
              <p>W_el = VT²/(2·C)  [elastisch werk]</p>
              <p>W_res = (π²·R·f·VT²)/2  [resistief werk]</p>
              <p>W_iPEEP = PEEPi·VT  [drempelwerk]</p>
            </div>
            <p className="text-sm text-gray-300 leading-7 mt-2">
              Voor een gegeven V̇A geldt: <span className="font-mono text-cyan-300">VT = V̇A/f + VD</span>. Als je dat invult in W_tot en vervolgens naar f minimaliseert, krijg je Otis' vergelijking.
            </p>
          </div>

          <div className="space-y-3">
            {otisRows.map((item) => (
              <div key={item.formula} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <p className="text-xs md:text-sm font-mono text-yellow-300 break-words mb-1">{item.formula}</p>
                <p className="text-sm text-gray-300 leading-6">{item.explain}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-yellow-300 mb-2">Klinische interpretatie</h3>
            <ul className="space-y-2 text-sm text-gray-300 leading-7">
              <li>
                <span className="text-sky-300">↑ Compliance (C):</span> f_opt stijgt licht (elastisch werk minder pijnlijk, dus meer frequentie verdraaglijk).
              </li>
              <li>
                <span className="text-sky-300">↓ Compliance (C):</span> f_opt daalt (ARDS: langzamer ademen, dieper, minder energieverspilling).
              </li>
              <li>
                <span className="text-sky-300">↑ Weerstand (R):</span> f_opt daalt sterk (resistief werk neemt toe, dus lagere frequentie beter).
              </li>
              <li>
                <span className="text-sky-300">↑ τ (=R×C, trage long):</span> f_opt ↓ (COPD patiënten hebben lagere natuurlijke frequentie).
              </li>
              <li>
                <span className="text-sky-300">↑ Auto-PEEP (PEEPi):</span> extra energiekosten; W_iPEEP domineert en verhoogt W_tot aanzienlijk.
              </li>
            </ul>
          </div>
        </section>

        {/* MEAD SECTIE */}
        <section className="iasv-print-section bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Mead-principe: ontleding van ademarbeid in componenten</h2>
          
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-cyan-300 mb-2">Waarom componenten ontleden?</h3>
            <p className="text-sm text-gray-300 leading-7">
              Otis zei: <span className="text-yellow-300">"er is een optimum"</span>. Mead voegde toe: <span className="text-yellow-300">"begrijp waarom"</span>. Door de ademarbeid in drie fysische componenten te splitsen, worden de mechanismen zichtbaar. Dat maakt klinische beslissingen beter te volgen.
            </p>
          </div>

          <div className="space-y-3">
            {meadRows.map((item) => (
              <div key={item.formula} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <p className="text-xs md:text-sm font-mono text-cyan-300 break-words mb-1">{item.formula}</p>
                <p className="text-sm text-gray-300 leading-6">{item.explain}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-cyan-300 mb-2">Praktische vraag: wanneer domineert welke component?</h3>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="pl-3 border-l-2 border-sky-400">
                <span className="text-sky-300 font-semibold">Normaal longweefsel (C ~100 mL/cmH₂O, R ~5 cmH₂O·s/L):</span>
                <p className="mt-1">W_el klein, W_res klein, W_iPEEP nul (geen auto-PEEP). Totaal laag. Natuurlijke f ~12-20 bpm.</p>
              </div>
              <div className="pl-3 border-l-2 border-yellow-400">
                <span className="text-yellow-300 font-semibold">ARDS-long (C ~30 mL/cmH₂O, R ~20 cmH₂O·s/L):</span>
                <p className="mt-1">W_el EXPLODEERT (1/C ×3,3). Alleen al elastisch werk &gt;50% van totaal. W_res ook ↑ door tubussen/circuit. f_opt ↓↓ naar 8-12 bpm.</p>
              </div>
              <div className="pl-3 border-l-2 border-orange-400">
                <span className="text-orange-300 font-semibold">COPD/obstructie (R ~30-50, C normaal, PEEPi ~5-15 cmH₂O):</span>
                <p className="mt-1">W_res stijgt kwadratisch met f. Auto-PEEP domineert. f_opt daalt, en de patiënt krijgt last van air trapping. W_iPEEP kan 40-50% van het totaal uitmaken.</p>
              </div>
              <div className="pl-3 border-l-2 border-pink-400">
                <span className="text-pink-300 font-semibold">Neuromusculaire zwakte (patiënt kan niet hard inspireren):</span>
                <p className="mt-1">Hoog VT is lastig, dus f↑. W_res neemt toe met f. Paradoxaal genoeg betekent dat meer arbeid voor minder V̇A. Ondersteuning is dan nodig.</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-cyan-300 mb-2">Grafische gedachte: werkoppervlakken</h3>
            <p className="text-sm text-gray-300 leading-7">
              Zet VT op de x-as en f op de y-as. Voor een gegeven V̇A kun je alle "zelf-consistente" (f, VT)-punten plotten. Kleur je elk punt naar W_tot, dan krijg je een oppervlak. Het laagste punt in dat oppervlak is het Otis-optimum. Als je vervolgens <span className="text-yellow-300">niet mag kiezen uit alle punten (bijv. VT &lt;= 400 mL door een drukgrens)</span>, zoek je het laagste punt in de <span className="text-yellow-300">toegestane zone</span>. Dat kan anders zijn dan het onbeperkte optimum; precies dat doet iASV.
            </p>
          </div>
        </section>

        {/* IASV BESLISLOGICA */}
        <section className="iasv-print-section bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">iASV-algoritme: van theorie naar klinische implementatie</h2>
          
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-green-300 mb-2">Vijfstappenprocedure</h3>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-300 leading-6">
              {iasvSteps.map((step, idx) => (
                <li key={idx}><span className="text-green-300 font-semibold">Stap {idx+1}:</span> {step}</li>
              ))}
            </ol>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-green-300 mb-2">Gedetailleerde veiligheidslimieten</h3>
            <div className="space-y-3 text-sm">
              <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                <p className="text-pink-300 font-mono mb-1">Ppeak ≤ P_limit (bijv. 30 cmH₂O)</p>
                <p className="text-gray-300 text-xs leading-6">Piekdruk is de stuwkracht. Formule: <span className="font-mono">Ppeak = PEEP_tot + VT/C + R·π·f·VT</span>. Risico op druktrauma.</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                <p className="text-pink-300 font-mono mb-1">Pplat ≤ 30 cmH₂O (ARDSnet standard)</p>
                <p className="text-gray-300 text-xs leading-6">Plateaudruk is de elastische druk. <span className="font-mono">Pplat = PEEP_tot + VT/C</span>. Prognostisch belangrijk.</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                <p className="text-pink-300 font-mono mb-1">ΔP = Pplat - PEEP_tot ≤ 13-15 cmH₂O</p>
                <p className="text-gray-300 text-xs leading-6">Driving pressure. Sterke predictor voor uitkomst (Amato et al. 2015) en belangrijker dan absolute Pplat.</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                <p className="text-pink-300 font-mono mb-1">VT/kg ≤ 6-8 mL/kg IBW</p>
                <p className="text-gray-300 text-xs leading-6">Preventie van longvolumetrauma. 6 mL/kg is de ARDSnet-gold standard voor ARDS.</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                <p className="text-pink-300 font-mono mb-1">PEEPi ≤ 5 cmH₂O (ideaal)</p>
                <p className="text-gray-300 text-xs leading-6">Auto-PEEP-limiet. Bij COPD of obstructie kan dit lastig zijn. Balans: recruitment versus air trapping.</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-green-300 mb-2">VT_ceiling bepalen: de meest restrictieve limiet wint</h3>
            <p className="text-sm text-gray-300 leading-7">
              Voor elke limiet bereken je: <span className="text-yellow-300">"welk VT kan ik maximaal gebruiken?"</span> Bijvoorbeeld:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-300 mt-2 font-mono text-xs">
              <li>Uit Ppeak: VT_ceiling_ppeak = (P_limit - PEEP_tot - R·π·f·VT) × C  [eigenlijk iteratief]</li>
              <li>Uit ΔP: VT_ceiling_dp = 13 × C</li>
              <li>Uit VT/kg: VT_ceiling_kg = 6 × IBW</li>
              <li>Kies: VT_ceiling = MIN(VT_ceiling_ppeak, VT_ceiling_dp, VT_ceiling_kg, ...)</li>
            </ul>
            <p className="text-sm text-gray-300 leading-7 mt-2">
              <span className="text-yellow-300">Dit is waar iASV transparant wordt:</span> je ziet <span className="text-yellow-300">welke limiet dominant is</span>. In ARDS domineert meestal ΔP of VT/kg; in COPD is dat vaak PEEPi of air trapping.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-green-300 mb-2">Aanpassingslogica</h3>
            <p className="text-sm text-gray-300 leading-7 mb-2">
              Scenario: f_opt = 15 bpm, VT_opt = 450 mL, maar VT_ceiling = 320 mL (wegens ΔP grens).
            </p>
            <p className="text-sm text-gray-300 leading-7 font-mono bg-gray-900 p-2 rounded">
              VT_actual = 320 mL (pas aan naar het plafond)<br/>
              f_actual = V̇A / (VT_actual - VD) × 60  [houd V̇A constant, verhoog f]<br/>
              f_actual = 4 / (0.32 - 0.15) × 60 = 4 / 0.17 × 60 ≈ 1412 bpm ?? [fout, opnieuw berekenen]
            </p>
            <p className="text-sm text-gray-300 leading-7 mt-2">
              Eigenlijk: als V̇A = (VT - VD) × f, dan geldt f = V̇A / (VT - VD). Met VT_actual = 320 mL, VD = 150 mL en V̇A = 4 L/min:
            </p>
            <p className="text-sm text-gray-300 leading-7 font-mono bg-gray-900 p-2 rounded">
              f_actual = 4000 mL/min / (320 - 150) mL = 4000 / 170 ≈ 23.5 bpm
            </p>
            <p className="text-sm text-gray-300 leading-7 mt-2">
              Dus in dit geval: <span className="text-yellow-300">de frequentie moet stijgen van 15 naar ongeveer 24 bpm</span> om dezelfde V̇A te handhaven. Dat is een <span className="text-yellow-300">veiligheidsgebonden compromis</span>.
            </p>
          </div>
        </section>

        <section className="iasv-print-section bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Hoe je dit kort kunt samenvatten</h2>
          <p className="text-sm text-gray-300 leading-7">
            iASV is geen black box die zomaar een frequentie kiest. Het is een gecontroleerde optimalisatie: eerst een energetisch optimum op basis van klassieke fysiologie, daarna begrenzing door longbeschermende veiligheidsregels. Als de patiëntmechanica verandert, verschuift het optimum mee, maar de veiligheidslimieten blijven strikt bewaakt.
          </p>
          <p className="text-sm text-gray-300 leading-7">
            In discussies helpt deze zin: <span className="text-yellow-300">"Otis bepaalt waar het efficiënt is, Mead verklaart waarom, en iASV beslist pas definitief nadat alle veiligheidslimieten zijn toegepast."</span>
          </p>
        </section>

        {/* BIOLOGISCHE MECHANICA */}
        <section className="iasv-print-section bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Biologische mechanica: dieper inzicht in long- en thoraxfysiologie</h2>
          
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-blue-300 mb-2">Compliance: Elastische Eigenschappen van Long en Thorax</h3>
            <p className="text-sm text-gray-300 leading-7 mb-2">
              Compliance (C) is geen statische waarde; het verandert met volume, positie, en pathologie.
            </p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><span className="text-blue-300 font-semibold">Statische compliance (Cstat):</span> gemeten zonder stroming, dus zuiver elastisch. Cstat = VT / (Pplat - PEEP).</li>
              <li><span className="text-blue-300 font-semibold">Dynamische compliance (Cdyn):</span> met stroming erin. Cdyn = VT / (Ppeak - PEEP). Cdyn &lt; Cstat bij obstructieve pathologie.</li>
              <li><span className="text-blue-300 font-semibold">Volume-afhankelijkheid:</span> compliance is niet lineair. Bij hoge volumes (overinflatie) daalt C. Bij zeer lage volumes (atelectase) ook. Optimum ergens in het midden.</li>
              <li><span className="text-blue-300 font-semibold">Positie-effect:</span> ruglig &gt; zijligging &gt; buikligging (in supine ARDS is compliance laag).</li>
              <li><span className="text-blue-300 font-semibold">PEEP-effect:</span> PEEP kan compliance verbeteren door recruitment, maar teveel PEEP veroorzaakt overdistensie.</li>
            </ul>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-blue-300 mb-2">Weerstand: Stroming, Viscositeit, Turbulentie</h3>
            <p className="text-sm text-gray-300 leading-7 mb-2">
              Weerstand is niet lineair. Het hangt af van stroompatroon en Reynoldsgetal.
            </p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><span className="text-blue-300 font-semibold">Laminar vs. turbulent:</span> bij lage stroming (laag Re) geldt Poiseuille (R ∝ viscositeit); bij hoge stroming (hoog Re) groeit R met stroming² (turbulentie-effect).</li>
              <li><span className="text-blue-300 font-semibold">Circuit-weerstand:</span> endotraheale buis, filter, circuit-lijnen dragen bij. Dit kan 30-50% van totale R zijn!</li>
              <li><span className="text-blue-300 font-semibold">Diepe obstructie:</span> bronchitis, bronchioloïitis (viraal) verhoogt R exponentieel. COPD-patiënten kunnen R &gt; 40 cmH₂O·s/L hebben.</li>
              <li><span className="text-blue-300 font-semibold">Frequentie-effect:</span> bij zeer hoge frequentie (&gt;40 bpm) worden turbulente effecten merkbaar; R gedraagt zich niet-lineair.</li>
            </ul>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-blue-300 mb-2">Dode Ruimte: Anatomie vs. Fysiologie</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><span className="text-blue-300 font-semibold">Anatomische dode ruimte (VDanat):</span> ~150 mL, vast (mondholte tot terminale bronchioli).</li>
              <li><span className="text-blue-300 font-semibold">Alveolaire dode ruimte (VDalv):</span> geventileerde maar niet-geperfundeerde alvéolen (V/Q &gt;&gt; 1). Stijgt in ARDS (lokaal collapse), longembolie (vaatobstructie), cardiogeen shock (hypoperfusie).</li>
              <li><span className="text-blue-300 font-semibold">Fysiologische dode ruimte (VD = VDanat + VDalv):</span> Kan stijgen van 150 mL (gezond) naar 400-600 mL (ARDS). Dit vergroot f_opt aanzienlijk!</li>
            </ul>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-blue-300 mb-2">Tijdconstante (τ) en Expiratiodynamica</h3>
            <p className="text-sm text-gray-300 leading-7 mb-2">
              τ = R × C bepaalt hoe snel een eenheid "op" of "af" ventileert.
            </p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><span className="text-blue-300 font-semibold">Normale waarden:</span> τ ≈ 0.3-0.5 s. 95% vulling in ~3τ = 1-1.5 s.</li>
              <li><span className="text-blue-300 font-semibold">COPD:</span> τ kan 1-2 s zijn (hoge R). Expiratie duurt veel langer. PEEPi ontstaat gemakkelijk.</li>
              <li><span className="text-blue-300 font-semibool">ARDS:</span> τ normaal of laag (compliance ↓, dus τ ↓), maar heterogeen (sommige eenheden τ↑, andere τ↓).</li>
              <li><span className="text-blue-300 font-semibold">Auto-PEEP mechanisme:</span> als expiratieduur &lt; 3τ, voltooit de long niet zijn expiratie. Residual volume=PEEPi bouwt op.</li>
            </ul>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-blue-300 mb-2">Intrinsic PEEP (Auto-PEEP): Een Verborgen Vijand</h3>
            <p className="text-sm text-gray-300 leading-7 mb-2">
              Auto-PEEP is <span className="text-yellow-300">ongewenst</span> residueel-volumeniveau aan eind-expiratie. Het veroorzaakt:
            </p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><span className="text-blue-300 font-semibold">Extra drempelwerk (W_iPEEP):</span> inspiratiemuscels moeten eerst ~PEEPi overwinnen voordat lucht instroomt.</li>
              <li><span className="text-blue-300 font-semibold">Myocardiale compressie:</span> rechterkamer preload daalt; linkerkamer preload stijgt (interdependentie).</li>
              <li><span className="text-blue-300 font-semibold">Barotrauma risico:</span> totale PEEP = PEEPe + PEEPi kan hoog worden.</li>
              <li><span className="text-blue-300 font-semibold">Detectie:</span> inspiratie-occlusion (ventilator-trigger blokkeert expiratie; druk stijgt tot PEEPi gecompenseerd is).</li>
            </ul>
          </div>
        </section>

        {/* GEAVANCEERDE ONDERWERPEN */}
        <section className="iasv-print-section bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Geavanceerde Onderwerpen: Heterogeniteit, Recruitment & Derecruitment</h2>
          
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-purple-300 mb-2">Heterogene Ventilatie in ARDS</h3>
            <p className="text-sm text-gray-300 leading-7 mb-2">
              ARDS is niet homogeen: sommige lunggebieden hebben hoge compliance (gerecruit), andere lage (dichtgezet/atelectatisch).
            </p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><span className="text-purple-300 font-semibold">Densiteit-distributieveranderingen:</span> CT-scans tonen gemengde patronen (consolidatie, ground-glass, normaal).</li>
              <li><span className="text-purple-300 font-semibold">Gevolg voor mechanica:</span> als je hele long als één C behandelt, miss je lokale overdruk/onderdruk. Sommige eenheden krijgen hoog VT (stress), andere krijgen onvoldoende ventilatie (strain).</li>
              <li><span className="text-purple-300 font-semibold">Recruitment-derecruitment cycle:</span> lage PEEP = derecruitment (alvéolen vallen in); hoge PEEP = recruitment maar ook overdistensie. Optimale PEEP is ongrijpbaar.</li>
            </ul>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-purple-300 mb-2">Ventilator-Induced Lung Injury (VILI)</h3>
            <p className="text-sm text-gray-300 leading-7 mb-2">
              VILI is multi-mechanistische schade door ventilatie zelf.
            </p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><span className="text-purple-300 font-semibold">Barotrauma:</span> absolute druk te hoog (Ppeak &gt; 30-35 cmH₂O).</li>
              <li><span className="text-purple-300 font-semibold">Volutrauma (Overinflatie):</span> excessive stretch. Bijv. hoog VT in gezonde liep kan VILI veroorzaken.</li>
              <li><span className="text-purple-300 font-semibold">Atelectotrauma:</span> cyclische opening-sluiting van aldéolen (hoge shear stress). Laag PEEP, snelle stijging van VT.</li>
              <li><span className="text-purple-300 font-semibold">Biotrauma:</span> mechanische stress triggert inflammatie (cytokine release). Lokaal én systemisch.</li>
            </ul>
            <p className="text-sm text-gray-300 leading-7 mt-2">
              <span className="text-yellow-300">Implicatie voor iASV:</span> driving pressure &lt;15 cmH₂O voorkomt de meeste VILI-vormen.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-purple-300 mb-2">Stress-Strain Concept</h3>
            <p className="text-sm text-gray-300 leading-7 mb-2">
              Recente inzichten (Preis et al., Chiumello et al.) benadrukken <span className="text-yellow-300">stress</span> (druk per eenheid) en <span className="text-yellow-300">strain</span> (volume-vergroting per eenheid).
            </p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><span className="text-purple-300 font-semibold">Stress = ΔP (driving pressure):</span> niet absolute druk.</li>
              <li><span className="text-purple-300 font-semibold">Strain = VT/FRC (functional residual capacity):</span> hoe veel vergroting relatief tot basale volume.</li>
              <li><span className="text-purple-300 font-semibold">Veilige grenzen:</span> Stress &lt; 15 cmH₂O, Strain &lt; 1.0-1.5 (dus VT/FRC &lt; 1-1.5). Dit is meer conservatief dan oudere richtlijnen.</li>
            </ul>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-purple-300 mb-2">Pendelluft (Penguin Effect): Ventilatie Tussen Longgebieden</h3>
            <p className="text-sm text-gray-300 leading-7 mb-2">
              In heterogene ARDS kunnen gebieden met verschillende τ gevolgen hebben:
            </p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Eenheid A: τ kort → vult snel, leegt snel.</li>
              <li>Eenheid B: τ lang → vult langzaam, leegt langzaam.</li>
              <li><span className="text-yellow-300">Pendelluft:</span> tijdens het ademen stroomt lucht van A naar B (of vice versa). Dit veroorzaakt <span className="text-yellow-300">onefficiënte ventilatie</span> en <span className="text-yellow-300">extra weerstandskost</span>.</li>
            </ul>
          </div>
        </section>

        {/* KLINISCHE ONDERBOUWING */}
        <section className="iasv-print-section bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Klinische Onderbouwing: Onderzoeken die iASV's Principes Rechtvaardigen</h2>
          
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-orange-300 mb-2">ARDSnet LTV Trial (2000) — Landmark Study</h3>
            <p className="text-sm text-gray-300 leading-7">
              <span className="text-yellow-300">Bevinding:</span> 6 mL/kg IBW vs. 12 mL/kg reduceerde mortaliteit van 40% → 31% (p=0.007). Dit stelde vast dat "traditioneel" hoog VT schadelijk is. <span className="text-yellow-300">Implicatie voor iASV:</span> VT/kg ≤ 6-8 is niet onderhandelbaar.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-orange-300 mb-2">Driving Pressure Studies (Amato et al., 2015)</h3>
            <p className="text-sm text-gray-300 leading-7">
              <span className="text-yellow-300">Bevinding:</span> elke 1 cmH₂O stijging in ΔP was geassocieerd met ~5% toename in absolute mortality risk. ΔP was sterker predictor dan Ppeak of Pplat apart. <span className="text-yellow-300">Implicatie:</span> iASV's focus op ΔP &lt; 15 is evidence-based.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-orange-300 mb-2">Frequency-Volume Trade-off Studies</h3>
            <p className="text-sm text-gray-300 leading-7">
              Onderzoeken (bijv. Naccache et al.) tonen aan dat in ARDS met compliance ↓, lagere frequenties (12-14 bpm) met wat hoger VT dikwijls minder WOB geven dan traditionele (16-20 bpm). <span className="text-yellow-300">Implicatie:</span> Otis' principe (lagere f_opt bij lage C) klopt klinisch.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-orange-300 mb-2">Auto-PEEP in ARDS (verschillende cohorten)</h3>
            <p className="text-sm text-gray-300 leading-7">
              Studies tonen dat PEEPi van 2-8 cmH₂O in sedated ARDS-patiënten niet ongewoon is, vooral bij hogere frequenties. <span className="text-yellow-300">Implicatie:</span> iASV's transparante tracking van PEEPi helpt deze verborgen druk zichtbaar te maken.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-orange-300 mb-2">WOB Reducties via Optimale Frequentie (Fysiologische Studies)</h3>
            <p className="text-sm text-gray-300 leading-7">
              Esophageal pressure studies tonen aan dat WOB significant kan dalen (20-40%) door f_opt in plaats van "standaard" frequenties. <span className="text-yellow-300">Implicatie:</span> energetische efficiëntie (Otis/Mead) leidt tot concrete patiëntvoordelen.
            </p>
          </div>
        </section>

        {/* PARAMETERVARIATIE */}
        <section className="iasv-print-section bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Parametervariatie: Hoe Patiëntfactoren iASV-Output Beïnvloeden</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <h3 className="text-base font-semibold text-teal-300 mb-2">BMI en IBW</h3>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>Obees (BMI &gt; 30): IBW ↓ relatief, dus VT/kg berekening is conservatiever.</li>
                <li>Slanke patiënten: BMI laag, IBW bijna = werkelijk gewicht.</li>
                <li>Gevolg: obese ARDS patiënten krijgen lager VT → lagere ΔP → neiging tot lagere f.</li>
              </ul>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <h3 className="text-base font-semibold text-teal-300 mb-2">PEEP en Recruitment</h3>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>Hoge PEEP (15 cmH₂O): C kan stijgen (recruitment), maar PEEP_tot ↑ beperkt VT via ΔP.</li>
                <li>Lage PEEP (5 cmH₂O): C ↓ (derecruitment), maar ruimte voor VT. Trade-off.</li>
                <li>iASV recalculeert f_opt voor elke PEEP-instelling.</li>
              </ul>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <h3 className="text-base font-semibold text-teal-300 mb-2">Sedatie/Musculaire Kracht</h3>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>Volledig sedated: patiënt transpireert niet. iASV moet alles aandrijven. W_el, W_res tellen op.</li>
                <li>Licht sedated/awake: patiënt kan helpen. f_opt kan hoger, VT lager (patiënt doet mee).</li>
                <li>iASV aan- vs. uit-bewustzijn aanpassingen kunnen voorkomen dat patiënt "tegen ventilator in"gaat.</li>
              </ul>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <h3 className="text-base font-semibold text-teal-300 mb-2">Langweefselomslag (Healing vs. Progressive)</h3>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>Eerste dagen ARDS: C zeer laag. f_opt laag, ΔP hoogsteeds beperkend.</li>
                <li>Na 5-7 dagen: C stijgt (healing). f_opt stijgt, meer ruimte voor VT.</li>
                <li>iASV's adaptiviteit is hier waardevol: automatisch aanpassen aan verbetering.</li>
              </ul>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <h3 className="text-base font-semibold text-teal-300 mb-2">Positie & Gravitatie</h3>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>Ruglig: C laag, V/Q mismatch groot → f_opt laag, f_actual kan hoger (druk-beperkt).</li>
                <li>Buikligging: C stijgt ~15-25% → f_opt stijgt, VT kan iets omhoog.</li>
                <li>Zijligging: tussenpositie.</li>
              </ul>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <h3 className="text-base font-semibold text-teal-300 mb-2">Comorbiditeiten</h3>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>COPD + ARDS: R ↑↑, PEEPi ↑. f_opt ↓ sterk. Risico: auto-PEEP bouwt op.</li>
                <li>Cardiogeen shock + ARDS: cardiac output ↓ → perfusie ↓ → VDalv ↑ → f_opt ↑.</li>
                <li>Obesitas + ARDS: mechanica worse. C ↓, R ↑ (circuit). f_opt laag.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* BEPERKINGEN */}
        <section className="iasv-print-section bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Beperkingen & Edge Cases: Wanneer iASV Minder Geschikt Is</h2>
          
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-red-300 mb-2">Ernstige Auto-PEEP-Situaties</h3>
            <p className="text-sm text-gray-300 leading-7">
              Bij zeer obstructieve patiënten (COPD exacerbatie, status asthmaticus) kan PEEPi 10-20 cmH₂O bereiken. <span className="text-yellow-300">Gevolg:</span> Otis-optimum kan onrealistisch zijn; de patiënt kan simpelweg niet "snel genoeg uitademen". iASV kan dit herkennen, maar het kernprobleem (luchtval) is niet oplosbaar met frequency/volume ajustment alleen—je hebt bronchodilatatie, medicatie, etc. nodig.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-red-300 mb-2">Patiënten met Spontane Ademhaling (niet sedated, strong respiratory drive)</h3>
            <p className="text-sm text-gray-300 leading-7">
              iASV is oorspronkelijk ontworpen voor gesedeerde, passief-geventileerde patiënten. Bij spontaan ademende patiënten kan de patiënt "trekken tegen het ventilator-algoritme". <span className="text-yellow-300">Gevolg:</span> meer sedatie nodig, of iASV moet in een andere assist-modus werken. Dit is nog onderzoeksgebied.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-red-300 mb-2">Extreme Compliance (zeer laag of zeer hoog)</h3>
            <p className="text-sm text-gray-300 leading-7">
              <span className="text-yellow-300">Zeer laag (C &lt; 10 mL/cmH₂O):</span> f_opt zeer laag (&lt; 8 bpm). Bij V̇A = 4 L/min wordt VT ontzettend hoog. Kan buiten fysieke/medische grenzen gaan. <span className="text-yellow-300">Zeer hoog (C &gt; 150 mL/cmH₂O):</span> f_opt zeer hoog (&gt; 30 bpm). Patiënt ademt hyperventilatie of acidose. iASV volgt het optimum, maar klinisch moet je soms handmatig interfereren.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-red-300 mb-2">Heterogene ARDS met Lokale Collapse/Overdistensie</h3>
            <p className="text-sm text-gray-300 leading-7">
              iASV behandelt de long als één homogeen systeem. In werkelijkheid kunnen sommige gebieden collapsed zijn, anderen overdistended. <span className="text-yellow-300">Gevolg:</span> gemiddelde compliance geeft een vals optimum; enkele eenheden worden te veel belast. Remedie: recruitment manoeuvers (handmatig), individuele PEEP-titration, prone positioning—buiten iASV scope.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-red-300 mb-2">Onnauwkeurige C/R-Metingen</h3>
            <p className="text-sm text-gray-300 leading-7">
              iASV vertrouwt op nauwkeurige schatting van compliance en weerstand. Bij onzuivere occlusions, lekken, patient effort tijdens meting kan C/R foutief zijn. <span className="text-yellow-300">Gevolg:</span> f_opt wordt berekend op foute input. Oplossing: regelmatige hercalibratie, controle-metingen.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-red-300 mb-2">Patiënten die Spontaan Herstellen (sterke spontane atemnooddrive)</h3>
            <p className="text-sm text-gray-300 leading-7">
              Bij weaning kunnen patiënten zelf meer spontane ademarbeid willen leveren. iASV berekent een optimum op basis van mechanica, maar de eigen respons van de patiënt kan hiervan afwijken. Nodig: modus-switching naar PSV of andere spontane-breathingmodi.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-red-300 mb-2">Patiënten met Abnormale Meetwaarden</h3>
            <p className="text-sm text-gray-300 leading-7">
              <span className="text-yellow-300">Zeer hoge weerstand (R &gt; 40):</span> kan betekenen: obstructie-massief, fout in meting, of circuit-probleem (Filter verstopt). <span className="text-yellow-300">Zeer lage compliance (C &lt; 5):</span> kan echte ARDS zijn, maar ook: patiënt niet volledig sedated, thorax-stijfheid, etc. iASV moet "outliers" herkennen en klinicus waarschuwen.
            </p>
          </div>
        </section>

        {/* SAMENVATTINGS-REFLECTIE */}
        <section className="iasv-print-section bg-gray-900 border border-gray-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Slotopmerkingen: iASV in Perspectief</h2>
          
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-emerald-300 mb-2">Waarom deze Theorie Belangrijk is</h3>
            <p className="text-sm text-gray-300 leading-7">
              In moderne IC-zorg is handmatig ventilatormanagement te veel een "trial-and-error" proces. iASV plaatst klassieke fysiologie (Otis 1950, Mead jaren 1960) centraal en combineert het met moderne longbeschermende evidence. Dit maakt ventilatie meer <span className="text-yellow-300">principieel</span>, minder <span className="text-yellow-300">willekeurig</span>.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-emerald-300 mb-2">De Toekomst: Adaptiviteit, Heterogeniteit, AI</h3>
            <p className="text-sm text-gray-300 leading-7">
              Volgende stap: <span className="text-yellow-300">regionale compliance/weerstand-schatting</span> (CT-gebaseerd of PEEP-sweep curves) zodat iASV ook heterogene ARDS kan aanpakken. <span className="text-yellow-300">Machine learning</span> kan patroon-herkenning verbeteren. Maar de onderliggende fysiologie (Otis/Mead) zal waarschijnlijk blijven gelden.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-emerald-300 mb-2">Voor Klinische Praktijk</h3>
            <p className="text-sm text-gray-300 leading-7">
              <span className="text-yellow-300">Onthoud:</span>
            </p>
            <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-300 mt-2">
              <li>iASV is geen "set and forget". Regelmatig controleren (C, R, PEEPi, V̇A-behoefte).</li>
              <li>Altijd de klinische waarnemingen tegen de nummers afwegen. Patiënt is leidraad.</li>
              <li>Als iASV ongebruikelijk kiest (bijv. f_opt = 30 bpm), denk na: is meting goed? Klopt V̇A-behoefte?</li>
              <li>iASV helpt, vervangt geen klinische oordeel.</li>
            </ol>
          </div>
        </section>
      </main>
    </div>
  );
}
