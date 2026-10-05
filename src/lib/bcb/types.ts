export type IndicatorCode = "selic" | "cdi" | "ipca" | "dolar";

export interface SeriesPoint {
  /** Data no formato dd/MM/yyyy, como devolvido pela API do BCB */
  date: string;
  value: number;
}

export interface IndicatorExtra {
  label: string;
  value: string;
}

export interface IndicatorSummary {
  code: IndicatorCode;
  sgsCode: number;
  label: string;
  unit: string;
  description: string;
  /** Casas decimais adequadas à escala da série */
  decimals: number;
  /** Prefixo de exibição, usado por séries monetárias */
  prefix?: string;
  current: number;
  previous: number;
  variation: number;
  variationPercent: number;
  trend: "up" | "down" | "stable";
  updatedAt: string;
  series: SeriesPoint[];
  extra?: IndicatorExtra;
}
