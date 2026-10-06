import Link from "next/link";

/**
 * O herói é a tese do projeto: as duas metades não são features paralelas, uma
 * alimenta a outra. Por isso a composição é um par de células dividindo o mesmo
 * fio, com a terceira célula embaixo explicando o que as liga — a estrutura
 * conta a arquitetura antes do texto contar.
 */

const SERIES = [
  { code: "432", label: "Selic" },
  { code: "12", label: "CDI" },
  { code: "433", label: "IPCA" },
  { code: "1", label: "Dólar PTAX" },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <section className="py-20 sm:py-28">
        <p className="label">Projeto de portfólio — engenharia full‑stack</p>

        <h1 className="font-display mt-6 max-w-4xl text-[2.5rem] leading-[0.98] font-semibold tracking-[-0.035em] text-balance sm:text-6xl lg:text-7xl">
          Dado público do Banco Central,
          <br />
          <span className="text-signal">lido em tempo real.</span>
        </h1>

        <p className="mt-7 max-w-xl text-[1.0625rem] leading-relaxed text-muted">
          Um painel que transforma as séries do Banco Central em leitura útil, e um chat
          onde um assistente responde pelos mesmos números. As duas metades consomem a
          mesma camada de domínio.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard"
            className="focus-ring bg-signal px-5 py-3 text-sm font-medium text-surface transition-opacity hover:opacity-90"
          >
            Abrir o painel
          </Link>
          <Link
            href="/chat"
            className="focus-ring border border-rule-strong px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-signal hover:text-signal"
          >
            Entrar no chat
          </Link>
        </div>

        <ul className="mt-14 flex flex-wrap items-baseline gap-x-8 gap-y-3">
          {SERIES.map((serie) => (
            <li key={serie.code} className="flex items-baseline gap-2">
              <span className="font-mono text-[0.6875rem] text-muted">
                SGS {serie.code}
              </span>
              <span className="text-sm text-ink">{serie.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid-rules grid sm:grid-cols-2">
        <article className="bg-surface p-8 sm:p-10">
          <p className="label">Painel</p>
          <h2 className="font-display mt-4 text-2xl font-semibold tracking-[-0.02em]">
            Indicadores com leitura derivada
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Selic, CDI, IPCA e dólar PTAX com tendência e histórico. Acima do dado bruto,
            os cruzamentos que respondem o que ele significa: juro real, distância da meta
            de inflação, rendimento de um valor no CDI.
          </p>
          <Link
            href="/dashboard"
            className="focus-ring mt-6 inline-block text-sm font-medium text-signal underline decoration-signal/30 underline-offset-4 transition-colors hover:decoration-signal"
          >
            Ver os indicadores
          </Link>
        </article>

        <article className="bg-surface p-8 sm:p-10">
          <p className="label">Chat</p>
          <h2 className="font-display mt-4 text-2xl font-semibold tracking-[-0.02em]">
            Salas em tempo real com o <span className="text-signal">@bcb</span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Socket.IO sobre servidor próprio, com presença, indicador de digitação e
            histórico persistido. Mencione o assistente e ele responde pelas mesmas séries
            que o painel consome.
          </p>
          <Link
            href="/chat"
            className="focus-ring mt-6 inline-block text-sm font-medium text-signal underline decoration-signal/30 underline-offset-4 transition-colors hover:decoration-signal"
          >
            Abrir uma sala
          </Link>
        </article>
      </section>

      <section className="border-x border-b border-rule bg-sunk px-8 py-10 sm:px-10">
        <p className="label">O que liga as duas metades</p>
        <p className="mt-4 max-w-3xl text-[1.0625rem] leading-relaxed text-ink">
          O assistente não conversa sobre economia: ele lê o mesmo instrumento que o painel
          mostra. A camada de domínio em <span className="font-mono text-sm">lib/</span> não
          conhece React nem rotas, e é consumida tanto pelos Server Components do painel
          quanto pelo servidor Socket.IO do chat — então o número que aparece no card é,
          literalmente, o número que o <span className="text-signal">@bcb</span> responde.
        </p>
      </section>

      <div className="h-20" />
    </div>
  );
}
