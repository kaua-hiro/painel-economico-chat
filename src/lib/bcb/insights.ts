import type { IndicatorSummary } from "./types";
import { annualizeDailyRate, compoundAccumulated } from "./service";
import { formatNumber } from "@/lib/format";

export interface Insight {
  title: string;
  value: string;
  description: string;
}

/** Meta de inflação definida pelo CMN para o período corrente. */
const INFLATION_TARGET = 3;

function find(indicators: IndicatorSummary[], code: IndicatorSummary["code"]) {
  return indicators.find((indicator) => indicator.code === code);
}

/**
 * Converte as séries brutas do BCB em leituras diretas: juro real, distância da
 * meta de inflação, oscilação cambial do período e rendimento do CDI.
 */
export function buildInsights(indicators: IndicatorSummary[]): Insight[] {
  const insights: Insight[] = [];

  const selic = find(indicators, "selic");
  const ipca = find(indicators, "ipca");
  const dolar = find(indicators, "dolar");
  const cdi = find(indicators, "cdi");

  const ipca12m = ipca ? compoundAccumulated(ipca.series.slice(-12)) : null;

  if (selic && ipca12m !== null) {
    const realRate = ((1 + selic.current / 100) / (1 + ipca12m / 100) - 1) * 100;
    insights.push({
      title: "Juro real",
      value: `${formatNumber(realRate)}% a.a.`,
      description: `Selic de ${formatNumber(selic.current)}% descontada a inflação de ${formatNumber(ipca12m)}% acumulada em 12 meses.`,
    });
  }

  if (ipca12m !== null) {
    const gap = ipca12m - INFLATION_TARGET;
    const position = gap > 0 ? "acima da meta" : gap < 0 ? "abaixo da meta" : "na meta";
    insights.push({
      title: "IPCA vs. meta",
      value: `${formatNumber(Math.abs(gap))} p.p. ${position}`,
      description: `Inflação acumulada de ${formatNumber(ipca12m)}% em 12 meses, contra meta de ${formatNumber(INFLATION_TARGET)}% ao ano.`,
    });
  }

  if (dolar && dolar.series.length > 1) {
    const values = dolar.series.map((point) => point.value);
    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first) * 100;
    const min = Math.min(...values);
    const max = Math.max(...values);
    insights.push({
      title: "Oscilação do dólar",
      value: `${change >= 0 ? "+" : "-"}${formatNumber(Math.abs(change))}%`,
      description: `Nas últimas ${dolar.series.length} cotações o dólar variou entre R$ ${formatNumber(min, 4)} e R$ ${formatNumber(max, 4)}.`,
    });
  }

  if (cdi) {
    const annual = annualizeDailyRate(cdi.current);
    insights.push({
      title: "CDI sobre R$ 1.000",
      value: `R$ ${formatNumber(1000 * (annual / 100))}`,
      description: `Rendimento bruto em 12 meses a 100% do CDI (${formatNumber(annual)}% a.a.), sem descontar impostos.`,
    });
  }

  return insights;
}
