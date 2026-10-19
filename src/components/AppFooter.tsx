import { copyrightLine, versionLine } from "@/lib/app-info";

/** Onderregel met disclaimer, copyright en versie (hoofdpagina en theoriepagina). */
export default function AppFooter() {
  return (
    <footer className="space-y-1 border-t border-gray-800 py-4 text-center text-xs text-gray-600">
      <p>
        Educatieve simulator — niet voor klinisch gebruik
        <span className="mx-2 text-gray-700">·</span>
        {copyrightLine()}
      </p>
      <p className="tabular-nums text-gray-700">{versionLine()}</p>
    </footer>
  );
}
