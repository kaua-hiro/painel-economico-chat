"use client";

import clsx from "clsx";
import type { IndicatorSummary } from "@/lib/bcb/types";
import { formatNumber, formatSigned } from "@/lib/format";
import { Sparkline } from "./Sparkline";

const TREND_COLOR = {
  up: "var(--up)",
  down: "var(--down)",
  stable: "var(--muted)",
} as const;

const TREND_TEXT = {
  up: "text-up",
  down: "text-down",
  stable: "text-muted",
} as const;

/**
 * Célula do instrumento. Não é uma caixa com borda própria: os fios vêm do
 * contêiner `.grid-rules`, e a seleção é marcada por uma barra de 2px no topo,
 * do mesmo azul do resto — o estado ativo usa a régua, não um preenchimento.
 */
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
        "focus-ring group relative flex flex-col gap-5 p-6 text-left transition-colors",
        selected ? "bg-surface" : "bg-paper hover:bg-surface",
      )}
    >
      <span
        aria-hidden
        className={clsx(
          "absolute inset-x-0 top-0 h-0.5 transition-colors",
          selected ? "bg-signal" : "bg-transparent",
        )}
      />

      <div className="flex items-baseline justify-between gap-3">
        <span className="label">{indicator.label}</span>
        <span className="font-mono text-[0.625rem] text-muted">
          SGS {indicator.sgsCode}
        </span>
      </div>

      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="readout text-[2.75rem]">
            {indicator.prefix}
            {formatNumber(indicator.current, decimals)}
          </span>
          {!indicator.prefix && (
            <span className="font-mono text-xs text-muted">{indicator.unit}</span>
          )}
        </div>

        <p className={clsx("tabular mt-2 font-mono text-xs", TREND_TEXT[indicator.trend])}>
          {indicator.trend === "stable"
            ? "estável vs. leitura anterior"
            : `${formatSigned(indicator.variation, decimals)} vs. leitura anterior`}
        </p>
      </div>

      <Sparkline id={indicator.code} data={indicator.series} color={color} />

      <div className="mt-auto flex flex-col gap-1 border-t border-rule pt-3">
        <p className="text-xs leading-snug text-muted">{indicator.description}</p>
        <p className="font-mono text-[0.625rem] text-muted">
          atualizado em {indicator.updatedAt}
        </p>
        {indicator.extra && (
          <p className="tabular font-mono text-[0.6875rem] text-signal">
            {indicator.extra.label}: {indicator.extra.value}
          </p>
        )}
      </div>
    </button>
  );
}
