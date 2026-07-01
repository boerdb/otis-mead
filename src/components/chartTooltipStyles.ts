import type { CSSProperties } from "react";

/** Gedeelde Recharts-tooltip styling (donker thema). */
export const chartTooltipContentStyle: CSSProperties = {
  margin: 0,
  padding: 10,
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: 8,
  whiteSpace: "nowrap",
};

export const chartTooltipLabelStyle: CSSProperties = {
  margin: 0,
};

export function chartTooltipItemStyle(color: string): CSSProperties {
  return {
    display: "block",
    paddingTop: 4,
    paddingBottom: 4,
    color,
  };
}
