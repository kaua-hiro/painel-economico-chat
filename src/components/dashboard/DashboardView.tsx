"use client";

import { useState } from "react";
import type { IndicatorSummary } from "@/lib/bcb/types";
import type { Insight } from "@/lib/bcb/insights";
import { IndicatorCard } from "./IndicatorCard";
import { SeriesChart } from "./SeriesChart";

export function DashboardView({
  indicators,
  insights,
}: {
  indicators: IndicatorSummary[];
  insights: Insight[];
}) {
  const [selectedCode, setSelectedCode] = useState(indicators[0]?.code);
  const selected = indicators.find((indicator) => indicator.code === selectedCode) ?? indicators[0];

  return (
    <div className="flex flex-col">
      {/* As quatro leituras dividem fios entre si: é um instrumento de quatro
          mostradores, não quatro cartões soltos. */}
      <section className="grid-rules grid sm:grid-cols-2 xl:grid-cols-4">
        {indicators.map((indicator) => (
          <IndicatorCard
            key={indicator.code}
            indicator={indicator}
            selected={indicator.code === selected?.code}
            onSelect={() => setSelectedCode(indicator.code)}
          />
        ))}
      </section>

      {selected && (
        <section className="border-x border-b border-rule bg-surface">
          <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-rule px-6 py-5">
            <div className="flex items-baseline gap-3">
              <span className="label">Histórico</span>
              <h2 className="font-display text-lg font-semibold tracking-[-0.02em]">
                {selected.label}
              </h2>
            </div>
            <p className="font-mono text-[0.6875rem] text-muted">
              {selected.series.length} leituras · série {selected.sgsCode} do SGS · clique em
              um mostrador para trocar
            </p>
          </header>
          <div className="px-4 py-6 sm:px-6">
            <SeriesChart indicator={selected} />
          </div>
        </section>
      )}

      <section className="mt-16">
        <div className="flex items-baseline gap-3">
          <span className="label">Leitura dos dados</span>
          <span className="h-px flex-1 bg-rule" />
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
          Cruzamentos calculados a partir das séries brutas — o que os números significam
          quando lidos juntos.
        </p>

        <div className="grid-rules mt-7 grid sm:grid-cols-2 xl:grid-cols-4">
          {insights.map((insight) => (
            <article key={insight.title} className="bg-surface p-6">
              <p className="label">{insight.title}</p>
              <p className="readout mt-4 text-[1.75rem] text-signal">{insight.value}</p>
              <p className="mt-4 text-xs leading-relaxed text-muted">{insight.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
