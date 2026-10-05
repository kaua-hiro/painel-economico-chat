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
    <div className="flex flex-col gap-12">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
        <section className="rounded-xl border border-ink-700 bg-ink-900 p-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-display text-xl font-semibold">
                Histórico — {selected.label}
              </h2>
              <p className="text-sm text-paper-400">
                Últimas {selected.series.length} leituras da série {selected.sgsCode} do SGS.
              </p>
            </div>
            <p className="font-mono text-xs text-paper-400">
              Selecione um indicador acima para trocar a série
            </p>
          </div>
          <SeriesChart indicator={selected} />
        </section>
      )}

      <section>
        <h2 className="font-display text-xl font-semibold">Leitura dos dados</h2>
        <p className="mt-1 text-sm text-paper-400">
          Cruzamentos calculados a partir das séries brutas — o que os números significam.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {insights.map((insight) => (
            <article
              key={insight.title}
              className="rounded-xl border border-ink-700 bg-ink-800 p-6"
            >
              <p className="font-mono text-xs tracking-widest text-paper-400 uppercase">
                {insight.title}
              </p>
              <p className="font-mono tabular mt-2 text-2xl font-medium text-gold-400">
                {insight.value}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-paper-400">
                {insight.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
