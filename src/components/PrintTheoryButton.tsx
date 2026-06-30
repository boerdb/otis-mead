"use client";

export default function PrintTheoryButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="text-xs md:text-sm px-3 py-1.5 rounded-md border border-gray-600 text-gray-200 hover:bg-gray-800 hover:text-white transition-colors"
    >
      Print deze pagina
    </button>
  );
}
