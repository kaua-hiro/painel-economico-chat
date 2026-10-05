"use client";

import clsx from "clsx";
import type { IndicatorSummary } from "@/lib/bcb/types";
import { formatNumber, formatSigned, trendArrow } from "@/lib/format";
import { Sparkline } from "./Sparkline";

const TREND_COLOR = {
  up: "var(--signal-up)",
  down: "var(--signal-down)",
  stable: "var(--paper-400)",
} as const;

export function IndicatorCard({
  indicator,
  selected,
  onSelect,
}: {
  indicator: IndicatorSummary;
  selected: boolean;
  onSelect: () => void;
}) {
  const { decimals } = indicator;
  const color = TREND_COLOR[indicator.trend];

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={clsx(
        "focus-ring flex flex-col gap-4 rounded-xl border bg-ink-900 p-6 text-left transition-colors",
        selected ? "border-gold-500" : "border-ink-700 hover:border-ink-600",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs tracking-widest text-paper-400 uppercase">
            {indicator.label}
          </p>
          <p className="mt-1 text-xs leading-snug text-paper-400">{indicator.description}</p>
        </div>
        <span className="font-mono text-[10px] text-ink-600">SGS {indicator.sgsCode}</span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="font-mono tabular text-3xl font-medium text-paper-100">
          {indicator.prefix}
          {formatNumber(indicator.current, decimals)}
        </span>
        {!indicator.prefix && <span className="text-sm text-paper-400">{indicator.unit}</span>}
      </div>

      <div className="flex items-center gap-2 text-xs whitespace-nowrap">
        <span className="font-mono tabular" style={{ color }}>
          {trendArrow(indicator.trend)}{" "}
          {indicator.trend === "stable" ? "estável" : formatSigned(indicator.variation, decimals)}
        </span>
        <span className="text-paper-400">vs. leitura anterior</span>
      </div>

      <Sparkline id={indicator.code} data={indicator.series} color={color} />

      <div className="flex flex-col gap-1 border-t border-ink-700 pt-3 text-[11px] text-paper-400">
        <span>Atualizado em {indicator.updatedAt}</span>
        {indicator.extra && (
          <span className="font-mono tabular text-gold-400">
            {indicator.extra.label}: {indicator.extra.value}
          </span>
        )}
      </div>
    </button>
  );
}
