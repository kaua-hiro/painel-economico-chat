export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatSigned(value: number, decimals = 2): string {
  const formatted = formatNumber(Math.abs(value), decimals);
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
}

export function trendArrow(trend: "up" | "down" | "stable"): string {
  if (trend === "up") return "▲";
  if (trend === "down") return "▼";
  return "•";
}
