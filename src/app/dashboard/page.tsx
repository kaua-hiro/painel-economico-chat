import type { Metadata } from "next";
import { getIndicatorsReport } from "@/lib/bcb/service";
import { buildInsights } from "@/lib/bcb/insights";
import { DashboardView } from "@/components/dashboard/DashboardView";

export const metadata: Metadata = {
  title: "Painel econômico — dados do Banco Central",
  description:
    "Selic, CDI, IPCA e dólar PTAX consumidos da API de dados abertos do Banco Central do Brasil.",
};

/**
 * Renderizada a cada requisição de propósito: o cache das séries é da própria
 * aplicação (1h, em memória, preenchido só com resposta válida), então render
 * dinâmico não gera chamada externa e uma falha pontual do BCB se corrige na
 * requisição seguinte, em vez de congelar um painel incompleto.
 */
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { indicators, unavailable } = await getIndicatorsReport();
  const insights = buildInsights(indicators);

  if (indicators.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h1 className="font-display text-2xl font-semibold">Painel indisponível</h1>
        <p className="mt-2 text-sm text-muted">
          A API do Banco Central não respondeu. Recarregue a página em alguns instantes.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10 flex flex-col gap-4">
        <p className="label">Banco Central do Brasil — Sistema Gerenciador de Séries Temporais</p>
        <h1 className="font-display text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">
          Painel econômico
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          Quatro séries oficiais consultadas em tempo de requisição, com cache de uma
          hora, tendência calculada sobre a leitura anterior e cruzamentos derivados
          abaixo dos gráficos.
        </p>
      </header>

      {unavailable.length > 0 && (
        <p
          role="status"
          className="mb-8 border-l-2 border-down bg-down/5 px-4 py-3 text-xs text-down"
        >
          O Banco Central não respondeu por {unavailable.join(" e ")} nesta consulta. Os
          demais indicadores seguem atualizados e a série volta assim que a API
          responder.
        </p>
      )}

      <DashboardView indicators={indicators} insights={insights} />
    </div>
  );
}
