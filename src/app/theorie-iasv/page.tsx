import type { Metadata } from "next";
import Link from "next/link";
import PrintTheoryButton from "@/components/PrintTheoryButton";

export const metadata: Metadata = {
  title: "iASV-theorie - uitgebreide referentie",
  description:
    "Theoretische referentie bij de iASV-simulator: het Otis-optimum, de componenten van ademarbeid, de ASV-veiligheidsregels, longbescherming en de beperkingen van het model.",
};

const symbolRows = [
  { sym: "f", unit: "1/s of /min", desc: "Ademfrequentie. In de vergelijkingen in Hz (1/s), op de monitor per minuut." },
  { sym: "VT", unit: "L", desc: "Teugvolume. Longbeschermend doel 6 mL/kg IBW (bereik 4–8)." },
  { sym: "V̇E", unit: "L/min", desc: "Minuutvolume: VT × f." },
  { sym: "V̇A", unit: "L/min", desc: "Alveolaire ventilatie: (VT − VD) × f. Bepaalt samen met de CO₂-productie de PaCO₂." },
  { sym: "VD", unit: "L", desc: "Dode ruimte. ASV schat de luchtwegdode ruimte als 2.2 mL/kg IBW (Radford). De fysiologische dode ruimte (anatomisch + alveolair) is bij ARDS vaak veel groter." },
  { sym: "R", unit: "cmH₂O·s/L", desc: "Inspiratoire weerstand van tube en luchtwegen. Geïntubeerd ongeveer 5–10, bij ernstige obstructie > 20. Stijgt met de flow (Rohrer)." },
  { sym: "C", unit: "mL/cmH₂O", desc: "Compliance van het respiratoire systeem (long + thoraxwand): 1/C = 1/C_long + 1/C_thoraxwand. Geventileerde IC-patiënt zonder longziekte ongeveer 50–80, ARDS vaak 20–40." },
  { sym: "Cstat", unit: "mL/cmH₂O", desc: "Statische compliance: VT / (Pplat − PEEP_tot)." },
  { sym: "Cdyn", unit: "mL/cmH₂O", desc: "Dynamische ‘compliance’: VT / (Ppeak − PEEP_tot). Bevat ook de resistieve druk en is daarom altijd lager dan Cstat; het verschil groeit bij hoge weerstand of flow." },
  { sym: "τ", unit: "s", desc: "Tijdconstante τ = R × C. Na 1τ is 63% en na 3τ 95% van het volume uitgeademd. ASV meet de expiratoire tijdconstante (RCexp) per ademteug." },
  { sym: "PEEPe", unit: "cmH₂O", desc: "Ingestelde (extrinsieke) PEEP." },
  { sym: "PEEPi", unit: "cmH₂O", desc: "Intrinsieke PEEP (auto-PEEP): alveolaire druk boven PEEPe aan het eind van de expiratie, door onvolledige uitademing." },
  { sym: "PEEP_tot", unit: "cmH₂O", desc: "Totale PEEP: PEEPe + PEEPi." },
  { sym: "Ppeak", unit: "cmH₂O", desc: "Maximale luchtwegdruk tijdens inspiratie: elastische plus resistieve component. Zegt weinig over de alveolaire belasting." },
  { sym: "Pplat", unit: "cmH₂O", desc: "Plateaudruk bij inspiratoire pauze (geen flow): PEEP_tot + VT/C. Longbeschermend doel ≤ 30 cmH₂O." },
  { sym: "ΔP", unit: "cmH₂O", desc: "Driving pressure: Pplat − PEEP_tot = VT/C. Sterkste ventilatorgerelateerde voorspeller van mortaliteit bij ARDS (Amato 2015)." },
  { sym: "IBW", unit: "kg", desc: "Ideaal lichaamsgewicht (Devine), op basis van lengte: man 50 + 0.91 × (lengte in cm − 152.4); vrouw 45.5 + 0.91 × (lengte in cm − 152.4)." },
  { sym: "W_el", unit: "J", desc: "Elastisch werk per inspiratie: VT²/(2C)." },
  { sym: "W_res", unit: "J", desc: "Resistief werk per inspiratie bij sinusoïdale flow: π²·R·f·VT²/4." },
  { sym: "W_iPEEP", unit: "J", desc: "Drempelwerk: PEEPi × VT. Een spontaan ademende patiënt moet PEEPi overwinnen voordat er flow ontstaat." },
  { sym: "MP", unit: "J/min", desc: "Mechanisch vermogen: energie die de ventilator per minuut aan het respiratoire systeem overdraagt (Gattinoni 2016)." },
];

const otisRows = [
  {
    formula: "Ẇ(f) = f · [ VT²/(2C) + π²·R·f·VT²/4 ],   met VT = V̇A/f + VD",
    explain:
      "Inspiratoire arbeid per minuut langs de V̇A-hyperbool. Lage f maakt VT groot (elastisch werk stijgt kwadratisch), hoge f verhoogt de flow (resistief werk) en verspilt meer ventilatie aan de dode ruimte.",
  },
  {
    formula: "dẆ/df = 0   ⇒   π²·τ·f² + f − V̇A/VD = 0",
    explain:
      "Minimaliseren naar f levert een kwadratische vergelijking op. De f²-term komt uit het resistieve werk, de f-term uit het elastische werk en de constante uit de verhouding V̇A/VD. Alleen τ = R·C en V̇A/VD bepalen het optimum.",
  },
  {
    formula: "f_opt = ( √(1 + 2a·τ·V̇A/VD) − 1 ) / (a·τ),   a = 2π²",
    explain:
      "De positieve wortel, in Hz. Dit is de vorm die in ASV wordt gebruikt; de constante a hangt af van het veronderstelde flowprofiel (2π² voor sinusoïdale flow).",
  },
  {
    formula: "VT_opt = V̇A/f_opt + VD",
    explain:
      "Het bijbehorende teugvolume volgt uit het behoud van alveolaire ventilatie.",
  },
];

const workRows = [
  {
    formula: "W_el = VT² / (2·C)",
    explain:
      "Elastisch werk per inspiratie: de oppervlakte onder de statische druk-volumelijn. Kwadratisch in VT en omgekeerd evenredig met C.",
  },
  {
    formula: "W_res = π²·R·f·VT² / 4",
    explain:
      "Resistief werk tijdens de inspiratie bij sinusoïdale flow (piekflow π·f·VT). Neemt lineair toe met R en f en kwadratisch met VT. De expiratie is passief: die wordt gedreven door de elastische energie die tijdens de inspiratie is opgeslagen.",
  },
  {
    formula: "W_iPEEP = PEEPi · VT",
    explain:
      "Drempelwerk bij spontane ademhaling: de ademspieren moeten eerst PEEPi overwinnen voordat de alveolaire druk onder de luchtwegdruk zakt en flow ontstaat. Bij volledig passieve beademing levert de ventilator deze energie.",
  },
  {
    formula: "dW/df langs de hyperbool = 0",
    explain:
      "Het optimum ligt waar de toename van resistief werk bij een hogere f precies opweegt tegen de afname van elastisch werk door het kleinere VT. Langs VT (bij vaste f) bestaat geen minimum: V̇A ligt dan niet vast.",
  },
];

const scenarioRows = [
  { name: "Geventileerd, gezonde longen", mech: "C 60, R 8, PEEP 5 → τ 0.48 s", otis: "14.9 /min · 489 mL", iasv: "Otis-optimum binnen alle limieten · Pinsp 13.7 · PEEPi 0.0" },
  { name: "ARDS", mech: "C 30, R 12, PEEP 10 → τ 0.36 s", otis: "16.4 /min · 458 mL", iasv: "16.9 /min · 450 mL (ΔP ≤ 15 begrenst) · Pinsp 25.6 · MP 18.8 J/min" },
  { name: "COPD", mech: "C 60, R 25, PEEP 5 → τ 1.50 s", otis: "9.6 /min · 674 mL", iasv: "12.3 /min · 560 mL (8 mL/kg begrenst; f_max = 13.3) · PEEPi 1.2" },
];

const iasvSteps = [
  "Meet de longmechanica (RCexp, compliance, weerstand) per ademteug.",
  "Bepaal het doelminuutvolume: %MinVol × 0.1 L/kg IBW/min (volwassene). Bij IntelliVent-ASV past de regelkring op PetCO₂ dit percentage automatisch aan.",
  "Bereken met de Otis-vergelijking de doelfrequentie en het bijbehorende doel-VT.",
  "Leg het doel binnen het veiligheidsvenster: minimale en maximale frequentie, minimaal VT en de drukgrens.",
  "Lever drukgecontroleerde (passieve patiënt) of drukondersteunde (actieve patiënt) ademteugen en pas de inspiratiedruk per ademteug aan tot het doel-VT is bereikt.",
];

const references: { id: number; text: string; doi?: string }[] = [
  { id: 1, text: "Otis AB, Fenn WO, Rahn H. Mechanics of breathing in man. J Appl Physiol. 1950;2:592–607.", doi: "10.1152/jappl.1950.2.11.592" },
  { id: 2, text: "Mead J. Control of respiratory frequency. J Appl Physiol. 1960;15:325–336." },
  { id: 3, text: "Radford EP. Ventilation standards for use in artificial respiration. J Appl Physiol. 1955;7:451–460.", doi: "10.1152/jappl.1955.7.4.451" },
  { id: 4, text: "Laubscher TP, Heinrichs W, Weiler N, Hartmann G, Brunner JX. An adaptive lung ventilation controller. IEEE Trans Biomed Eng. 1994;41:51–59.", doi: "10.1109/10.277271" },
  { id: 5, text: "Brunner JX, Laubscher TP, Banner MJ, Iotti G, Braschi A. Simple method to measure total expiratory time constant based on the passive expiratory flow-volume curve. Crit Care Med. 1995;23:1117–1122.", doi: "10.1097/00003246-199506000-00019" },
  { id: 6, text: "Arnal JM, Wysocki M, Nafati C, et al. Automatic selection of breathing pattern using adaptive support ventilation. Intensive Care Med. 2008;34:75–81.", doi: "10.1007/s00134-007-0847-0" },
  { id: 7, text: "Arnal JM, Wysocki M, Novotni D, et al. Safety and efficacy of a fully closed-loop control ventilation (IntelliVent-ASV) in sedated ICU patients with acute respiratory failure: a prospective randomized crossover study. Intensive Care Med. 2012;38:781–787.", doi: "10.1007/s00134-012-2548-6" },
  { id: 8, text: "The Acute Respiratory Distress Syndrome Network. Ventilation with lower tidal volumes as compared with traditional tidal volumes for acute lung injury and the acute respiratory distress syndrome. N Engl J Med. 2000;342:1301–1308.", doi: "10.1056/NEJM200005043421801" },
  { id: 9, text: "Amato MBP, Meade MO, Slutsky AS, et al. Driving pressure and survival in the acute respiratory distress syndrome. N Engl J Med. 2015;372:747–755.", doi: "10.1056/NEJMsa1410639" },
  { id: 10, text: "Gattinoni L, Tonetti T, Cressoni M, et al. Ventilator-related causes of lung injury: the mechanical power. Intensive Care Med. 2016;42:1567–1575.", doi: "10.1007/s00134-016-4505-2" },
  { id: 11, text: "Serpa Neto A, Deliberato RO, Johnson AEW, et al. Mechanical power of ventilation is associated with mortality in critically ill patients. Intensive Care Med. 2018;44:1914–1922.", doi: "10.1007/s00134-018-5375-6" },
  { id: 12, text: "Chiumello D, Carlesso E, Cadringher P, et al. Lung stress and strain during mechanical ventilation for acute respiratory distress syndrome. Am J Respir Crit Care Med. 2008;178:346–355.", doi: "10.1164/rccm.200710-1589OC" },
  { id: 13, text: "Protti A, Cressoni M, Santini A, et al. Lung stress and strain during mechanical ventilation: any safe threshold? Am J Respir Crit Care Med. 2011;183:1354–1362.", doi: "10.1164/rccm.201010-1757OC" },
  { id: 14, text: "Pepe PE, Marini JJ. Occult positive end-expiratory pressure in mechanically ventilated patients with airflow obstruction: the auto-PEEP effect. Am Rev Respir Dis. 1982;126:166–170.", doi: "10.1164/arrd.1982.126.1.166" },
  { id: 15, text: "de Durante G, del Turco M, Rustichini L, et al. ARDSNet lower tidal volume ventilatory strategy may generate intrinsic positive end-expiratory pressure in patients with acute respiratory distress syndrome. Am J Respir Crit Care Med. 2002;165:1271–1274.", doi: "10.1164/rccm.2105050" },
  { id: 16, text: "Yoshida T, Torsani V, Gomes S, et al. Spontaneous effort causes occult pendelluft during mechanical ventilation. Am J Respir Crit Care Med. 2013;188:1420–1427.", doi: "10.1164/rccm.201303-0539OC" },
  { id: 17, text: "Nuckton TJ, Alonso JA, Kallet RH, et al. Pulmonary dead-space fraction as a risk factor for death in the acute respiratory distress syndrome. N Engl J Med. 2002;346:1281–1286.", doi: "10.1056/NEJMoa012835" },
];

function Ref({ n }: { n: number | number[] }) {
  const ids = Array.isArray(n) ? n : [n];
  return (
    <sup className="text-sky-400">
      [
      {ids.map((id, i) => (
        <span key={id}>
          {i > 0 && ","}
          <a href={`#ref-${id}`} className="hover:underline">{id}</a>
        </span>
      ))}
      ]
    </sup>
  );
}

export default function TheoryIASVPage() {
  return (
    <div className="iasv-print-page min-h-screen bg-gray-950 text-gray-100">
      <header className="iasv-screen-header border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <h1 className="min-w-0 truncate text-sm md:text-base font-semibold tracking-wide text-sky-300">
            iASV-theoriecentrum<span className="hidden sm:inline"> — uitgebreide referentie</span>
          </h1>
          <div className="flex shrink-0 items-center gap-3">
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

      <main className="iasv-print-main max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <section className="iasv-print-section bg-gray-900 border border-gray-700 rounded-2xl p-4 sm:p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Inleiding: ASV en iASV</h2>
          <p className="text-sm text-gray-300 leading-7">
            Adaptive Support Ventilation (ASV) is een modus van Hamilton Medical waarin de clinicus een doelminuutvolume instelt en de ventilator zelf de combinatie van frequentie en teugvolume kiest<Ref n={4} />. Die keuze is gebaseerd op het werk van Otis, Fenn en Rahn uit 1950: bij een gegeven alveolaire ventilatie bestaat een frequentie waarbij de ademarbeid minimaal is<Ref n={1} />. ASV meet de longmechanica per ademteug, berekent dat optimum en legt het binnen een venster van veiligheidsregels.
          </p>
          <p className="text-sm text-gray-300 leading-7">
            IntelliVent-ASV (iASV) voegt daar twee gesloten regelkringen aan toe: het minuutvolume wordt bijgesteld op basis van de eind-expiratoire CO₂ (PetCO₂), en PEEP en FiO₂ op basis van de SpO₂<Ref n={7} />. De keuze van frequentie en teugvolume binnen dat minuutvolume blijft het ASV-principe.
          </p>
          <p className="text-sm text-gray-300 leading-7">
            De kernboodschap: <span className="text-yellow-300">eerst het energetisch gunstigste ademhalingspatroon bepalen, daarna begrenzen met longbeschermende regels</span>.
          </p>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-sky-300 mb-2">Wat de simulator wel en niet doet</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-300 leading-6">
              <li>De simulator gebruikt een longmodel met één compartiment en lineaire R en C. Het doel (f_opt, VT_opt) volgt uit de Otis-vergelijking met sinusoïdale flow, zoals in ASV.</li>
              <li>De ademteug zelf wordt afgegeven zoals bij ASV: drukgecontroleerd met een instelbare drukstijgtijd (P-ramp, standaard 50 ms), I:E 1:2, een korte drukafname bij het openen van de expiratieklep en passieve expiratie. Het model is exact opgelost (exponentiële ingangen), niet benaderd. Pinsp, plateaudruk, auto-PEEP en mechanisch vermogen volgen uit dat model; auto-PEEP is dus een uitkomst van τ en de expiratietijd, geen invoer. Expiratoire flowbeperking (zoals bij COPD) zit niet in het lineaire model, waardoor auto-PEEP daar wordt onderschat. Daarom kun je een gemeten PEEPi (expiratoire hold) invoeren: ligt die boven de modelvoorspelling, dan rekent de simulator met de gemeten waarde en verhoogt het verschil de alveolaire basisdruk, Pplat en de benodigde Pinsp.</li>
              <li>Met &quot;eigen ademfrequentie&quot; simuleer je een actieve patiënt. Ademt die langzamer dan het doel, dan vult ASV aan met verplichte teugen en blijft het werkpunt op het doel. Ademt die sneller, dan zijn alle teugen spontaan en houdt ASV het minuutvolume vast: het gemeten punt schuift over de V̇E-hyperbool (VT = V̇E/f) en de alveolaire ventilatie daalt. De inspanning van de patiënt (Pmus) en de exacte regeling van de drukondersteuning worden niet gemodelleerd.</li>
              <li>Als invoer gebruikt de simulator de alveolaire ventilatie V̇A. ASV werkt met een doelminuutvolume, waaruit V̇A = V̇E − f·VD volgt. De PetCO₂- en SpO₂-regelkringen van iASV worden niet gesimuleerd.</li>
              <li>De grenzen ΔP ≤ 15 cmH₂O, Pplat ≤ 30 cmH₂O en VT ≤ 8 mL/kg zijn didactische longbeschermende grenzen en geen Hamilton-instellingen. Het frequentievenster en het minimale VT volgen de ASV-regels.</li>
            </ul>
          </div>
        </section>

        {/* HISTORISCHE CONTEXT */}
        <section className="iasv-print-section bg-gray-900 border border-gray-700 rounded-2xl p-4 sm:p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Historische achtergrond</h2>
          <div className="space-y-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <h3 className="text-base font-semibold text-sky-300 mb-2">Arthur B. Otis, Wallace Fenn en Hermann Rahn (1950)</h3>
              <p className="text-sm text-gray-300 leading-7">
                Aan de University of Rochester werkten Otis, Fenn en Rahn de mechanica van de ademhaling kwantitatief uit<Ref n={1} />. Zij splitsten de ademarbeid in een elastische component (rekken van long en thoraxwand) en een resistieve component (stroming door de luchtwegen). Vervolgens lieten ze zien dat er voor een gegeven alveolaire ventilatie een <span className="text-yellow-300">frequentie bestaat waarbij de totale arbeid minimaal is</span>, en dat de spontane ademfrequentie van gezonde proefpersonen daar dicht bij ligt.
              </p>
              <p className="text-sm text-gray-300 leading-7 mt-2">
                Het kerninzicht: <span className="text-yellow-300">snel en ondiep ademen</span> kost resistief werk en verspilt ventilatie aan de dode ruimte; <span className="text-yellow-300">langzaam en diep ademen</span> kost elastisch werk. Het evenwicht hangt af van de tijdconstante τ = R·C en van de dode ruimte.
              </p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <h3 className="text-base font-semibold text-cyan-300 mb-2">John Mead (1960)</h3>
              <p className="text-sm text-gray-300 leading-7">
                Mead (Harvard School of Public Health) bouwde voort op dit model en stelde een ander optimalisatiecriterium voor: de ademhaling minimaliseert niet de arbeid maar de <span className="text-yellow-300">gemiddelde kracht</span> (drukamplitude) die de ademspieren moeten leveren<Ref n={2} />. Dat criterium sloot in zijn metingen beter aan bij de waargenomen frequenties, onder meer bij veranderde mechanica. Beide benaderingen voorspellen dezelfde richting: een kortere tijdconstante geeft een hogere optimale frequentie.
              </p>
              <p className="text-sm text-gray-300 leading-7 mt-2">
                ASV gebruikt de Otis-vergelijking; de naam &quot;Otis-Mead&quot; in deze simulator verwijst naar deze gezamenlijke fysiologische basis.
              </p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <h3 className="text-base font-semibold text-green-300 mb-2">Van fysiologie naar longbescherming</h3>
              <p className="text-sm text-gray-300 leading-7">
                In 1994 beschreven Laubscher, Brunner en collega&apos;s deze regelaar, toen nog Adaptive Lung Ventilation genoemd: de clinicus stelde een gewenste alveolaire ventilatie in en het toestel koos frequentie en inspiratiedruk op basis van de gemeten mechanica en dode ruimte<Ref n={4} />. In 2000 liet de ARDS Network-studie zien dat 6 mL/kg IBW in plaats van 12 mL/kg de mortaliteit bij ARDS verlaagde van 39.8% naar 31.0%<Ref n={8} />. Daarna volgden driving pressure<Ref n={9} /> en mechanisch vermogen<Ref n={10} /> als maten voor ventilatorgeïnduceerde longschade.
              </p>
              <p className="text-sm text-gray-300 leading-7 mt-2">
                Modern beademingsbeleid luidt daarom: <span className="text-yellow-300">efficiëntie nastreven binnen strikte veiligheidsgrenzen</span>.
              </p>
            </div>
          </div>
        </section>

        <section className="iasv-print-section bg-gray-900 border border-gray-700 rounded-2xl p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Symbolen, eenheden en definities</h2>
          <div className="overflow-x-auto">
            <table className="min-w-[560px] w-full text-xs md:text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700 bg-gray-800">
                  <th className="py-2 px-3 font-semibold">Symbool</th>
                  <th className="py-2 px-3 font-semibold">Eenheid</th>
                  <th className="py-2 px-3 font-semibold">Beschrijving en context</th>
                </tr>
              </thead>
              <tbody>
                {symbolRows.map((row) => (
                  <tr key={row.sym} className="border-b border-gray-800 align-top hover:bg-gray-800/50">
                    <td className="py-2 px-3 font-mono text-sky-300">{row.sym}</td>
                    <td className="py-2 px-3 text-gray-400 font-mono text-xs whitespace-nowrap">{row.unit}</td>
                    <td className="py-2 px-3 text-gray-300">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* OTIS SECTIE */}
        <section className="iasv-print-section bg-gray-900 border border-gray-700 rounded-2xl p-4 sm:p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Het Otis-optimum: frequentie en teugvolume</h2>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-yellow-300 mb-2">Het kernprobleem</h3>
            <p className="text-sm text-gray-300 leading-7">
              Stel: V̇A = 4 L/min en VD = 150 mL. Omdat V̇A = (VT − VD)·f, kan dezelfde alveolaire ventilatie met oneindig veel combinaties worden bereikt:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-300 mt-2">
              <li>f = 10/min, VT = 550 mL (langzaam en diep)</li>
              <li>f = 20/min, VT = 350 mL</li>
              <li>f = 40/min, VT = 250 mL (snel en ondiep; 60% van elke teug is dode ruimte)</li>
            </ul>
            <p className="text-sm text-gray-300 leading-7 mt-2">
              Welke combinatie kost de minste <span className="text-yellow-300">ademarbeid</span>? Het antwoord van Otis: er is één optimum, en dat hangt alleen af van τ en V̇A/VD.
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
                <span className="text-sky-300">Lage compliance (restrictief, ARDS):</span> τ wordt korter, dus f_opt stijgt en VT_opt daalt. Snel en ondiep ademen is bij een stijve long energetisch gunstig.
              </li>
              <li>
                <span className="text-sky-300">Hoge weerstand (obstructief, COPD, astma):</span> τ wordt langer, dus f_opt daalt en VT_opt stijgt. Langzaam en diep ademen geeft bovendien meer expiratietijd.
              </li>
              <li>
                <span className="text-sky-300">Grotere dode ruimte bij gelijke V̇A:</span> f_opt daalt en VT_opt stijgt, omdat elke teug relatief minder verspilt. Het benodigde minuutvolume neemt wel toe.
              </li>
              <li>
                <span className="text-sky-300">Hogere V̇A-behoefte (koorts, acidose):</span> f_opt stijgt.
              </li>
              <li>
                <span className="text-sky-300">Auto-PEEP:</span> komt niet voor in de Otis-vergelijking, maar verhoogt de arbeid van een spontaan ademende patiënt met PEEPi·VT per teug.
              </li>
            </ul>
            <p className="text-sm text-gray-300 leading-7 mt-2">
              Arnal en collega&apos;s zagen precies deze patronen bij ASV-patiënten: bij restrictieve longziekte koos ASV een hogere frequentie met een kleiner VT, bij obstructieve longziekte een lagere frequentie met een groter VT<Ref n={6} />.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-yellow-300 mb-2">Voorbeelden uit de simulator</h3>
            <p className="text-xs text-gray-400 mb-2">V̇A 5 L/min, IBW 70 kg (VD 154 mL), druklimiet 30 cmH₂O, P-ramp 50 ms. C in mL/cmH₂O, R in cmH₂O·s/L, drukken in cmH₂O. Deze scenario&apos;s staan ook als knop in de simulator.</p>
            <div className="overflow-x-auto">
              <table className="min-w-[640px] w-full text-xs md:text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="py-2 pr-3 font-semibold">Scenario</th>
                    <th className="py-2 px-3 font-semibold">Mechanica</th>
                    <th className="py-2 px-3 font-semibold">Otis-optimum</th>
                    <th className="py-2 pl-3 font-semibold">iASV-werkpunt</th>
                  </tr>
                </thead>
                <tbody>
                  {scenarioRows.map((row) => (
                    <tr key={row.name} className="border-b border-gray-800 align-top">
                      <td className="py-2 pr-3 text-gray-200">{row.name}</td>
                      <td className="py-2 px-3 text-gray-400 font-mono text-xs">{row.mech}</td>
                      <td className="py-2 px-3 text-yellow-300 font-mono text-xs">{row.otis}</td>
                      <td className="py-2 pl-3 text-green-300 font-mono text-xs">{row.iasv}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* COMPONENTEN VAN ADEMARBEID */}
        <section className="iasv-print-section bg-gray-900 border border-gray-700 rounded-2xl p-4 sm:p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Componenten van ademarbeid</h2>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-cyan-300 mb-2">Waarom componenten onderscheiden?</h3>
            <p className="text-sm text-gray-300 leading-7">
              Door de arbeid op te splitsen wordt zichtbaar <span className="text-yellow-300">welk mechanisme</span> het optimum bepaalt en waarom een ziektebeeld het ademhalingspatroon verschuift. De bewegingsvergelijking van het respiratoire systeem is P = PEEP_tot + V/C + R·V̇: elke term levert een eigen arbeidscomponent.
            </p>
          </div>

          <div className="space-y-3">
            {workRows.map((item) => (
              <div key={item.formula} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <p className="text-xs md:text-sm font-mono text-cyan-300 break-words mb-1">{item.formula}</p>
                <p className="text-sm text-gray-300 leading-6">{item.explain}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-cyan-300 mb-2">Welke component domineert?</h3>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="pl-3 border-l-2 border-sky-400">
                <span className="text-sky-300 font-semibold">Gezonde longen (C ≈ 60, R ≈ 8):</span>
                <p className="mt-1">Elastisch en resistief werk zijn beide bescheiden; geen auto-PEEP. f_opt rond 14–15/min.</p>
              </div>
              <div className="pl-3 border-l-2 border-yellow-400">
                <span className="text-yellow-300 font-semibold">ARDS (C ≈ 25–35, R ≈ 10–15):</span>
                <p className="mt-1">Het elastische werk per liter is twee keer zo hoog. Omdat τ kort is, verschuift het optimum naar een hogere frequentie met een kleiner VT. Driving pressure en plateaudruk worden de beperkende grenzen.</p>
              </div>
              <div className="pl-3 border-l-2 border-orange-400">
                <span className="text-orange-300 font-semibold">COPD of astma (R ≥ 20, C normaal of hoog, PEEPi 3–15):</span>
                <p className="mt-1">Resistief werk domineert en τ is lang. Het optimum ligt bij een lage frequentie met een groot VT, wat ook de expiratietijd verlengt. Bij spontane ademhaling komt daar het drempelwerk van PEEPi bij.</p>
              </div>
              <div className="pl-3 border-l-2 border-pink-400">
                <span className="text-pink-300 font-semibold">Neuromusculaire zwakte:</span>
                <p className="mt-1">De mechanica kan normaal zijn, maar de spierkracht schiet tekort. Patiënten ademen snel en ondiep, waardoor een groter deel van de ventilatie dode ruimte is. Ondersteuning verlaagt de last op de spieren.</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-cyan-300 mb-2">Grafisch: het f·VT-vlak</h3>
            <p className="text-sm text-gray-300 leading-7">
              Zet f op de x-as en VT op de y-as (zoals in de simulator). Alle combinaties met dezelfde V̇A liggen op de hyperbool VT = V̇A/f + VD. Langs die hyperbool heeft de arbeid één minimum: het Otis-optimum. Veiligheidsregels snijden delen van de hyperbool af. Valt het optimum in een verboden deel, dan kiest iASV het <span className="text-yellow-300">dichtstbijzijnde toegestane punt op dezelfde hyperbool</span>, zodat V̇A gelijk blijft.
            </p>
          </div>
        </section>

        {/* IASV BESLISLOGICA */}
        <section className="iasv-print-section bg-gray-900 border border-gray-700 rounded-2xl p-4 sm:p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Het ASV-algoritme: van theorie naar beademing</h2>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-green-300 mb-2">Werking in stappen</h3>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-300 leading-6">
              {iasvSteps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
            <p className="text-xs text-gray-400 leading-6 mt-3">
              ASV bepaalt RCexp uit de passieve expiratoire flow-volumecurve<Ref n={5} />. De simulator berekent τ uit de ingestelde R en C.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-green-300 mb-2">Veiligheidsregels van ASV</h3>
            <p className="text-xs text-gray-400 mb-3">Samengevat uit de literatuur en de fabrikantdocumentatie. De exacte waarden verschillen per softwareversie; de handleiding van het toestel is leidend.</p>
            <div className="space-y-3 text-sm">
              <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                <p className="text-pink-300 font-mono mb-1">f ≤ 20 / RCexp</p>
                <p className="text-gray-300 text-xs leading-6">Laat minstens 1τ inspiratietijd en 2τ expiratietijd over, om dynamische hyperinflatie (auto-PEEP) te beperken. Bij f = 20/τ en I:E 1:2 is Te precies 2τ: dan blijft aan het eind van de expiratie e⁻² ≈ 14% van het eind-inspiratoire volume achter. De simulator toont die auto-PEEP. Daarnaast geldt 5 ≤ f ≤ 60/min.</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                <p className="text-pink-300 font-mono mb-1">VT ≥ 2 × VD</p>
                <p className="text-gray-300 text-xs leading-6">Voorkomt dode-ruimteventilatie: bij een te klein VT bereikt te weinig verse lucht de alveoli.</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                <p className="text-pink-300 font-mono mb-1">Pinsp ≤ drukgrens</p>
                <p className="text-gray-300 text-xs leading-6">ASV houdt de inspiratiedruk onder een marge van de ingestelde maximale druk. In de simulator geldt voor de stationaire drukgecontroleerde teug bij blokdruk: Pinsp = PEEP + VT·(1 − x·y) / [C·(1 − x)·(1 − y)], met x = e^(−Ti/τ) en y = e^(−Te/τ). Hoe korter Ti ten opzichte van τ, en hoe langer de P-ramp, hoe meer druk nodig is voor hetzelfde VT.</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-green-300 mb-2">Aanvullende longbeschermende grenzen (didactisch)</h3>
            <div className="space-y-3 text-sm">
              <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                <p className="text-pink-300 font-mono mb-1">Pplat = PEEP_tot + VT/C ≤ 30 cmH₂O</p>
                <p className="text-gray-300 text-xs leading-6">Grens uit het ARDS Network-protocol<Ref n={8} />. Bij een stijve thoraxwand (obesitas, buikcompartiment) overschat Pplat de transpulmonale druk.</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                <p className="text-pink-300 font-mono mb-1">ΔP = VT/C ≤ 15 cmH₂O</p>
                <p className="text-gray-300 text-xs leading-6">Bij ARDS was een hogere driving pressure sterker geassocieerd met mortaliteit dan VT of Pplat afzonderlijk<Ref n={9} />.</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                <p className="text-pink-300 font-mono mb-1">VT ≤ 8 mL/kg IBW</p>
                <p className="text-gray-300 text-xs leading-6">Bovengrens van het ARDS Network-bereik; het doel is 6 mL/kg (4–8)<Ref n={8} />.</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-green-300 mb-2">Het gekozen werkpunt</h3>
            <p className="text-sm text-gray-300 leading-7">
              Elke regel snijdt een stuk van de V̇A-hyperbool af. Een grens op VT (ΔP, Pplat, VT/kg) verbiedt lage frequenties; f_max en VT_min verbieden hoge frequenties. De drukgrens hangt van VT én f af en wordt daarom langs de hyperbool opgelost. De simulator kiest het toegestane punt waarvan f het dichtst bij f_opt ligt en meldt welke regel dat punt bepaalt. Als geen enkel punt aan alle regels voldoet, meldt de simulator dat er geen veilig werkpunt is: dan moet het V̇A-doel of de instelling worden heroverwogen.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-green-300 mb-2">Rekenvoorbeeld</h3>
            <p className="text-sm text-gray-300 leading-7 mb-2">
              Stel: V̇A = 4 L/min, VD = 150 mL en f_opt = 15/min (VT_opt ≈ 417 mL). De driving pressure-grens staat maximaal VT = 320 mL toe.
            </p>
            <p className="text-sm text-gray-300 leading-7 font-mono bg-gray-900 p-2 rounded">
              f = V̇A / (VT − VD) = 4000 mL/min / (320 − 150) mL ≈ 23.5/min
            </p>
            <p className="text-sm text-gray-300 leading-7 mt-2">
              Om dezelfde V̇A te houden, moet de frequentie stijgen van 15 naar ongeveer 24/min. Controleer daarna of 23.5/min nog onder f_max = 20/τ ligt: bij τ = 0.5 s is dat 40/min.
            </p>
          </div>
        </section>

        <section className="iasv-print-section bg-gray-900 border border-gray-700 rounded-2xl p-4 sm:p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Samenvatting</h2>
          <p className="text-sm text-gray-300 leading-7">
            ASV is geen black box. Het is een gecontroleerde optimalisatie: eerst een energetisch optimum op basis van klassieke fysiologie, daarna begrenzing door veiligheidsregels. Verandert de mechanica, dan verschuift het optimum mee; de regels blijven gelden.
          </p>
          <p className="text-sm text-gray-300 leading-7">
            In één zin: <span className="text-yellow-300">&quot;Otis bepaalt waar het efficiënt is, de componenten van ademarbeid verklaren waarom, en de veiligheidsregels bepalen waar het mag.&quot;</span>
          </p>
        </section>

        {/* RESPIRATOIRE MECHANICA */}
        <section className="iasv-print-section bg-gray-900 border border-gray-700 rounded-2xl p-4 sm:p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Respiratoire mechanica in de praktijk</h2>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-blue-300 mb-2">Compliance</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><span className="text-blue-300 font-semibold">Statisch en dynamisch:</span> Cstat = VT / (Pplat − PEEP_tot) beschrijft de elastische eigenschappen. Cdyn = VT / (Ppeak − PEEP_tot) bevat ook de weerstand en is daarom geen zuivere compliance.</li>
              <li><span className="text-blue-300 font-semibold">Volumeafhankelijk:</span> de druk-volumecurve is sigmoïdaal. Bij laag volume (collaps) en bij hoog volume (overrekking) is de compliance lager.</li>
              <li><span className="text-blue-300 font-semibold">Long en thoraxwand:</span> een stijve thoraxwand (obesitas, intra-abdominale hypertensie) verlaagt de systeemcompliance zonder dat de long zelf zwaarder belast wordt. Slokdarmdrukmeting onderscheidt beide.</li>
              <li><span className="text-blue-300 font-semibold">PEEP:</span> kan compliance verbeteren door recruitment, maar te veel PEEP veroorzaakt overrekking en verlaagt haar weer.</li>
            </ul>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-blue-300 mb-2">Weerstand</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><span className="text-blue-300 font-semibold">Flowafhankelijk:</span> volgens Rohrer is ΔP = K₁·V̇ + K₂·V̇². Bij turbulente stroming neemt de schijnbare weerstand dus toe met de flow. Het model in de simulator neemt R constant.</li>
              <li><span className="text-blue-300 font-semibold">Tube en circuit:</span> de endotracheale tube is bij geïntubeerde patiënten vaak een groot deel van de totale weerstand, vooral bij een kleine diameter.</li>
              <li><span className="text-blue-300 font-semibold">Obstructie:</span> bronchospasme, slijm en dynamische luchtwegcollaps (COPD) verhogen R; bij een ernstige astma-aanval kan R ruim boven 20 cmH₂O·s/L liggen.</li>
            </ul>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-blue-300 mb-2">Dode ruimte</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><span className="text-blue-300 font-semibold">Luchtwegdode ruimte:</span> ongeveer 2.2 mL/kg IBW, ongeveer 150 mL bij een volwassene<Ref n={3} />. Bij een geïntubeerde patiënt vervangt de tube een deel van de bovenste luchtweg; HME-filter en connectoren voegen apparatuurdode ruimte toe.</li>
              <li><span className="text-blue-300 font-semibold">Alveolaire dode ruimte:</span> geventileerde maar niet-geperfundeerde alveoli. Neemt toe bij ARDS, longembolie en lage cardiac output.</li>
              <li><span className="text-blue-300 font-semibold">Fysiologische dode ruimte:</span> de som van beide, te meten met de Bohr-Enghoff-vergelijking. Bij ARDS is een hoge VD/VT geassocieerd met hogere mortaliteit<Ref n={17} />. ASV schat alleen de luchtwegdode ruimte; extra alveolaire dode ruimte vraagt een hoger %MinVol, wat iASV via PetCO₂ automatisch probeert te doen.</li>
            </ul>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-blue-300 mb-2">Tijdconstante en expiratie</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><span className="text-blue-300 font-semibold">Normale waarden:</span> geventileerd ongeveer 0.4–0.7 s, dus 95% lediging in 1.2–2 s.</li>
              <li><span className="text-blue-300 font-semibold">Obstructie:</span> τ van 1–2 s of meer. Een volledige expiratie duurt dan langer dan de beschikbare tijd, waardoor auto-PEEP ontstaat.</li>
              <li><span className="text-blue-300 font-semibold">ARDS:</span> τ is meestal kort door de lage compliance, maar regionaal heterogeen.</li>
              <li><span className="text-blue-300 font-semibold">Auto-PEEP:</span> als de expiratietijd korter is dan ongeveer 3τ, begint de volgende inspiratie voordat het evenwichtsvolume is bereikt. Ook bij ARDS kan dit optreden, bijvoorbeeld bij een hoge frequentie met een laag VT<Ref n={15} />.</li>
            </ul>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-blue-300 mb-2">Intrinsieke PEEP (auto-PEEP)</h3>
            <p className="text-sm text-gray-300 leading-7 mb-2">
              Auto-PEEP werd beschreven door Pepe en Marini<Ref n={14} /> en heeft deze gevolgen:
            </p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><span className="text-blue-300 font-semibold">Triggerlast:</span> een spontaan ademende patiënt moet eerst PEEPi overwinnen voordat de ventilator triggert. Dat kan leiden tot ineffectieve triggerpogingen.</li>
              <li><span className="text-blue-300 font-semibold">Hemodynamiek:</span> de hogere intrathoracale druk vermindert de veneuze terugvloed (lagere preload van rechter- en linkerkamer) en kan de afterload van de rechterkamer verhogen. Dit kan leiden tot hypotensie.</li>
              <li><span className="text-blue-300 font-semibold">Hyperinflatie:</span> een hoger eind-expiratoir longvolume verhoogt de plateaudruk en het risico op barotrauma.</li>
              <li><span className="text-blue-300 font-semibold">Meten:</span> statische PEEPi meet je met een eind-expiratoire occlusie (expiratoire hold) bij een passieve patiënt; een inspiratoire hold geeft de plateaudruk. Bij spontane ademhaling is een slokdarmdrukmeting nodig. In de simulator vul je de gemeten waarde in bij &quot;Gemeten PEEPi&quot;.</li>
            </ul>
          </div>
        </section>

        {/* GEAVANCEERDE ONDERWERPEN */}
        <section className="iasv-print-section bg-gray-900 border border-gray-700 rounded-2xl p-4 sm:p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Verdieping: heterogeniteit, VILI en stress-strain</h2>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-purple-300 mb-2">Heterogene ventilatie bij ARDS</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><span className="text-purple-300 font-semibold">Kleine long (baby lung):</span> het beluchte deel van de long is klein. Een VT dat voor de hele long normaal lijkt, rekt het beluchte deel onevenredig op.</li>
              <li><span className="text-purple-300 font-semibold">Gevolg voor de mechanica:</span> één gemiddelde C verbergt regionale verschillen. Sommige gebieden worden overrekt terwijl andere gecollabeerd blijven.</li>
              <li><span className="text-purple-300 font-semibold">Recruitment en derecruitment:</span> een te lage PEEP laat alveoli cyclisch openen en sluiten; een te hoge PEEP overrekt de gezonde gebieden. Er is geen eenduidige optimale PEEP.</li>
            </ul>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-purple-300 mb-2">Ventilatorgeïnduceerde longschade (VILI)</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><span className="text-purple-300 font-semibold">Barotrauma:</span> luchtlekkage (pneumothorax, pneumomediastinum) door een hoge transpulmonale druk. Pplat en ΔP zijn hiervoor betere maten dan Ppeak, omdat Ppeak ook de drukval over de tube bevat.</li>
              <li><span className="text-purple-300 font-semibold">Volutrauma:</span> schade door overrekking bij een te groot volume ten opzichte van de beschikbare (beluchte) long.</li>
              <li><span className="text-purple-300 font-semibold">Atelectotrauma:</span> schuifkrachten door het cyclisch openen en sluiten van alveoli bij een onvoldoende PEEP.</li>
              <li><span className="text-purple-300 font-semibold">Biotrauma:</span> mechanische belasting zet een ontstekingsreactie in gang, lokaal en systemisch.</li>
            </ul>
            <p className="text-sm text-gray-300 leading-7 mt-2">
              <span className="text-yellow-300">Betekenis voor de praktijk:</span> een lage driving pressure is geassocieerd met betere overleving<Ref n={9} />, maar een veilige drempel voor alle patiënten bestaat niet. Mechanisch vermogen combineert druk, volume en frequentie tot één maat; in een observationele analyse van ruim 8000 patiënten nam het risico op overlijden consistent toe boven ongeveer 17 J/min<Ref n={[10, 11]} />.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-purple-300 mb-2">Stress en strain</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><span className="text-purple-300 font-semibold">Stress:</span> de transpulmonale druk (luchtwegdruk min pleuradruk), de kracht per oppervlak op het longweefsel<Ref n={12} />.</li>
              <li><span className="text-purple-300 font-semibold">Strain:</span> de volumetoename ten opzichte van het rustvolume, ΔV/FRC.</li>
              <li><span className="text-purple-300 font-semibold">Verband:</span> stress ≈ specifieke longelastantie × strain; die elastantie was ongeveer 13 cmH₂O, vergelijkbaar bij gezonde longen en ARDS<Ref n={12} />. Omdat de verhouding tussen long- en systeemelastantie sterk wisselt (0.33–0.95), zijn Pplat en VT slechte maten voor stress en strain.</li>
              <li><span className="text-purple-300 font-semibold">Drempel:</span> bij gezonde varkens ontstond longschade pas boven een strain van ongeveer 1.5–2<Ref n={13} />; vertaling naar mensen vraagt voorzichtigheid. Zonder FRC- of slokdarmdrukmeting zijn deze grootheden aan het bed niet beschikbaar.</li>
            </ul>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-purple-300 mb-2">Pendelluft</h3>
            <p className="text-sm text-gray-300 leading-7">
              Pendelluft is het verschuiven van lucht tussen longgebieden zonder dat het totale teugvolume verandert. Het ontstaat bij regionale verschillen in tijdconstante en vooral bij krachtige spontane inademing in een beschadigde long: de lokale onderdruk in de afhangende gebieden zuigt lucht uit niet-afhangende gebieden<Ref n={16} />. Dit kan regionale overrekking veroorzaken die aan de ventilator niet zichtbaar is.
            </p>
          </div>
        </section>

        {/* KLINISCHE ONDERBOUWING */}
        <section className="iasv-print-section bg-gray-900 border border-gray-700 rounded-2xl p-4 sm:p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Klinische onderbouwing</h2>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-orange-300 mb-2">ARDS Network (2000)</h3>
            <p className="text-sm text-gray-300 leading-7">
              <span className="text-yellow-300">Bevinding:</span> 6 mL/kg IBW met Pplat ≤ 30 cmH₂O tegenover 12 mL/kg verlaagde de mortaliteit van 39.8% naar 31.0%<Ref n={8} />. <span className="text-yellow-300">Betekenis:</span> een VT-grens op basis van IBW is de basis van longbeschermende beademing.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-orange-300 mb-2">Driving pressure (Amato et al., 2015)</h3>
            <p className="text-sm text-gray-300 leading-7">
              <span className="text-yellow-300">Bevinding:</span> in een heranalyse van negen gerandomiseerde studies was ΔP de ventilatorvariabele die het sterkst samenhing met overleving. Elke toename van één standaarddeviatie (ongeveer 7 cmH₂O) ging samen met een relatief risico op overlijden van 1.41<Ref n={9} />. <span className="text-yellow-300">Betekenis:</span> het gaat om een associatie; een prospectief bewezen streefwaarde ontbreekt.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-orange-300 mb-2">Ademhalingspatroon onder ASV (Arnal et al., 2008)</h3>
            <p className="text-sm text-gray-300 leading-7">
              <span className="text-yellow-300">Bevinding:</span> in een observationeel cohort van 243 patiënten koos ASV bij passieve patiënten met ALI/ARDS mediaan 18/min en 7.6 mL/kg, en bij COPD 13/min en 9.3 mL/kg<Ref n={6} />. Bij patiënten die zelf triggerden verschilde het patroon niet tussen de groepen. <span className="text-yellow-300">Betekenis:</span> de Otis-voorspelling is klinisch herkenbaar bij passieve patiënten. Let op: het VT bij COPD lag boven de 8 mL/kg-grens van deze simulator.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-orange-300 mb-2">IntelliVent-ASV (Arnal et al., 2012)</h3>
            <p className="text-sm text-gray-300 leading-7">
              <span className="text-yellow-300">Bevinding:</span> in een gerandomiseerde cross-overstudie bij 50 gesedeerde IC-patiënten (twee periodes van 2 uur) was IntelliVent-ASV veilig. Minuutvolume, VT, plateaudruk (mediaan 24 naar 20 cmH₂O) en FiO₂ waren lager dan bij ASV, bij gelijke oxygenatie en een iets hogere PaCO₂<Ref n={7} />. <span className="text-yellow-300">Betekenis:</span> veelbelovend, maar grote studies naar harde uitkomsten zoals mortaliteit ontbreken.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-orange-300 mb-2">Auto-PEEP bij longbeschermende beademing</h3>
            <p className="text-sm text-gray-300 leading-7">
              <span className="text-yellow-300">Bevinding:</span> bij ARDS-patiënten volgens het ARDS Network-protocol ontstond door de hoge frequentie relevante intrinsieke PEEP<Ref n={15} />. <span className="text-yellow-300">Betekenis:</span> een hogere frequentie om V̇A te behouden is niet vrijblijvend. De ASV-regel f ≤ 20/τ beperkt dit risico.
            </p>
          </div>
        </section>

        {/* PARAMETERVARIATIE */}
        <section className="iasv-print-section bg-gray-900 border border-gray-700 rounded-2xl p-4 sm:p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Hoe patiëntfactoren het werkpunt verschuiven</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <h3 className="text-base font-semibold text-teal-300 mb-2">Lengte, gewicht en IBW</h3>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>IBW hangt alleen af van lengte en geslacht; longgrootte schaalt met lengte, niet met gewicht.</li>
                <li>Bij obesitas voorkomt VT op basis van IBW dat de long te veel volume krijgt.</li>
                <li>De stijve thoraxwand verlaagt C en τ, waardoor f_opt stijgt. Pplat overschat dan de belasting van de long.</li>
              </ul>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <h3 className="text-base font-semibold text-teal-300 mb-2">PEEP en recruitment</h3>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>Recruitment verhoogt C: τ wordt langer, f_opt daalt licht en er is meer ruimte voor VT binnen de ΔP-grens.</li>
                <li>Overrekking verlaagt C en verhoogt Pplat; de Pplat-grens wordt dan eerder bereikt.</li>
                <li>PEEP komt niet in de Otis-vergelijking voor; ze werkt via de compliance en via de drukgrenzen. Bij iASV kan de SpO₂-regelkring PEEP zelf aanpassen.</li>
              </ul>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <h3 className="text-base font-semibold text-teal-300 mb-2">Sedatie en eigen ademactiviteit</h3>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>Passieve patiënt: ASV levert drukgecontroleerde teugen met de doelfrequentie.</li>
                <li>Actieve patiënt: spontane teugen worden drukondersteund. Ademt de patiënt boven de doelfrequentie, dan levert ASV geen verplichte teugen en stuurt ze alleen de drukondersteuning bij. Het doelminuutvolume blijft leidend, dus bij een hogere eigen frequentie daalt het VT.</li>
                <li>Gevolg: snel en ondiep ademen bij gelijk minuutvolume verlaagt de alveolaire ventilatie, omdat elke teug dezelfde dode ruimte heeft. Op het ASV-scherm zie je dat als een gemeten punt dat rechts-onder het doel op de minuutvolumecurve ligt.</li>
                <li>Krachtige eigen inspanning maakt de gemeten mechanica minder betrouwbaar en verhoogt de transpulmonale druk.</li>
              </ul>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <h3 className="text-base font-semibold text-teal-300 mb-2">Beloop van ARDS</h3>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>Vroege fase: C laag, τ kort, f_opt hoog en VT klein; ΔP en Pplat zijn meestal de beperkende grenzen.</li>
                <li>Herstel: C stijgt, τ wordt langer, f_opt daalt en VT neemt toe binnen dezelfde grenzen.</li>
                <li>ASV volgt die verandering per ademteug zonder dat de instellingen hoeven te worden aangepast.</li>
              </ul>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <h3 className="text-base font-semibold text-teal-300 mb-2">Buikligging</h3>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>Buikligging maakt de verdeling van ventilatie en stress homogener en verbetert vaak de oxygenatie.</li>
                <li>Het effect op de systeemcompliance verschilt per patiënt; de thoraxwand wordt vaak stijver.</li>
                <li>Een verandering in C werkt via τ door in f_opt, zoals hierboven beschreven.</li>
              </ul>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <h3 className="text-base font-semibold text-teal-300 mb-2">Comorbiditeit</h3>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>COPD met ARDS: hoge R en lage C hebben tegengestelde effecten op τ. Het netto effect bepaalt f_opt; let vooral op auto-PEEP.</li>
                <li>Lage cardiac output of longembolie: de alveolaire dode ruimte stijgt. Er is meer minuutvolume nodig voor dezelfde PaCO₂.</li>
                <li>Metabole acidose of koorts: hogere V̇A-behoefte, dus een hoger f_opt.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* BEPERKINGEN */}
        <section className="iasv-print-section bg-gray-900 border border-gray-700 rounded-2xl p-4 sm:p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Beperkingen en bijzondere situaties</h2>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-red-300 mb-2">Ernstige luchtwegobstructie</h3>
            <p className="text-sm text-gray-300 leading-7">
              Bij een ernstige COPD-exacerbatie of astma-aanval kan PEEPi oplopen tot 10–20 cmH₂O. De regel f ≤ 20/τ beperkt de frequentie, maar het onderliggende probleem (expiratoire flowbeperking) los je niet op met frequentie en volume alleen. Bronchusverwijding, een lager minuutvolume (permissieve hypercapnie) en een lange expiratietijd blijven nodig.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-red-300 mb-2">Spontaan ademende patiënten</h3>
            <p className="text-sm text-gray-300 leading-7">
              ASV is ontworpen voor passieve én actieve patiënten en wordt ook gebruikt bij het ontwennen. De Otis-berekening gaat echter uit van passieve mechanica. Bij een sterke ademdrive kunnen RCexp-metingen onbetrouwbaar zijn, en kan de transpulmonale druk hoog zijn terwijl de ventilatordrukken laag blijven.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-red-300 mb-2">Extreme compliance</h3>
            <p className="text-sm text-gray-300 leading-7">
              <span className="text-yellow-300">Zeer lage C (&lt; 15 mL/cmH₂O):</span> τ is zeer kort en f_opt hoog, maar zelfs een klein VT geeft al een hoge driving pressure. Vaak is er geen werkpunt dat aan alle grenzen voldoet; dan zijn permissieve hypercapnie of extracorporale ondersteuning aan de orde. <span className="text-yellow-300">Zeer hoge C (emfyseem):</span> τ is lang en f_opt laag, met een groot VT; de VT/kg-grens en f_max bepalen dan het werkpunt.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-red-300 mb-2">Heterogene longen</h3>
            <p className="text-sm text-gray-300 leading-7">
              Het model behandelt de long als één compartiment. In werkelijkheid kunnen gebieden met korte en lange tijdconstanten naast elkaar bestaan, en kunnen gebieden gecollabeerd en overrekt zijn. Een gemiddelde τ geeft dan een gemiddeld optimum dat voor geen enkel gebied klopt. PEEP-titratie, recruitmentmanoeuvres en buikligging vallen buiten het ASV-algoritme.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-red-300 mb-2">Onbetrouwbare metingen</h3>
            <p className="text-sm text-gray-300 leading-7">
              Lekkage (cuff, bronchopleurale fistel), eigen ademactiviteit tijdens de expiratie en een flowsensor met condens maken de schatting van RCexp onbetrouwbaar. Onverwacht hoge of lage waarden van R of C vragen eerst om controle van patiënt en circuit (verstopt filter, knik in de tube) voordat je de uitkomst van het algoritme vertrouwt.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-red-300 mb-2">Dode ruimte en CO₂</h3>
            <p className="text-sm text-gray-300 leading-7">
              ASV schat VD uit IBW. Bij een grote alveolaire dode ruimte (ARDS, longembolie) is de werkelijke V̇A lager dan berekend. Bij conventionele ASV moet de clinicus %MinVol dan op geleide van de bloedgas verhogen; iASV doet dat via PetCO₂. Een groot verschil tussen PaCO₂ en PetCO₂ maakt die regelkring minder nauwkeurig.
            </p>
          </div>
        </section>

        {/* SLOTOPMERKINGEN */}
        <section className="iasv-print-section bg-gray-900 border border-gray-700 rounded-2xl p-4 sm:p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Slotopmerkingen</h2>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-emerald-300 mb-2">Waarom deze theorie ertoe doet</h3>
            <p className="text-sm text-gray-300 leading-7">
              ASV plaatst klassieke fysiologie (Otis 1950, Mead 1960) centraal en combineert die met moderne longbescherming. Wie de onderliggende vergelijking begrijpt, kan de keuze van het toestel voorspellen en herkennen wanneer die keuze niet past bij de patiënt.
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-base font-semibold text-emerald-300 mb-2">Voor de klinische praktijk</h3>
            <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-300 mt-2">
              <li>ASV en iASV zijn geen &quot;instellen en vergeten&quot;: controleer regelmatig mechanica, auto-PEEP, bloedgas en het gekozen patroon.</li>
              <li>Kiest het toestel een onverwacht patroon (bijvoorbeeld f 30/min bij een obstructieve patiënt), controleer dan eerst de metingen en het minuutvolumedoel.</li>
              <li>De veiligheidsregels van het toestel vervangen geen longbeschermende doelen zoals Pplat en ΔP: meet ze zelf.</li>
              <li>Het algoritme ondersteunt, maar vervangt het klinisch oordeel niet.</li>
            </ol>
          </div>
        </section>

        {/* BRONNEN */}
        <section className="iasv-print-section bg-gray-900 border border-gray-700 rounded-2xl p-4 sm:p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white">Bronnen</h2>
          <ol className="space-y-2 text-xs md:text-sm text-gray-300 leading-6">
            {references.map((r) => (
              <li key={r.id} id={`ref-${r.id}`} className="flex gap-3 scroll-mt-20">
                <span className="text-sky-400 font-mono shrink-0">[{r.id}]</span>
                <span>
                  {r.text}
                  {r.doi && (
                    <>
                      {" "}
                      <a href={`https://doi.org/${r.doi}`} className="text-sky-400 hover:underline break-all">
                        doi:{r.doi}
                      </a>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
