import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <section className="flex flex-col gap-6 border-b border-ink-700 py-20">
        <span className="font-mono text-xs tracking-[0.2em] text-gold-500 uppercase">
          Projeto de portfólio — engenharia full-stack
        </span>
        <h1 className="font-display max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-paper-100 sm:text-6xl">
          Dados econômicos de verdade.{" "}
          <span className="text-gold-500">Conversas em tempo real.</span>
        </h1>
        <p className="max-w-2xl text-lg text-paper-400">
          Um painel que consome a API pública do Banco Central do Brasil e transforma
          séries da Selic, CDI, IPCA e dólar em leitura útil — ao lado de um chat
          multi-sala com WebSockets, presença e indicador de digitação.
        </p>
      </section>

      <section className="grid gap-6 py-16 sm:grid-cols-2">
        <Link
          href="/dashboard"
          className="focus-ring group flex flex-col justify-between gap-6 rounded-xl border border-ink-700 bg-ink-900 p-8 transition-colors hover:border-gold-500"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs tracking-widest text-paper-400 uppercase">
              Painel
            </span>
            <span className="text-gold-500 transition-transform group-hover:translate-x-1">
              →
            </span>
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold text-paper-100">
              Indicadores do Banco Central
            </h2>
            <p className="mt-2 text-sm text-paper-400">
              Selic, CDI, IPCA e dólar PTAX com variação, tendência e histórico —
              atualizados direto da API do BCB.
            </p>
          </div>
        </Link>

        <Link
          href="/chat"
          className="focus-ring group flex flex-col justify-between gap-6 rounded-xl border border-ink-700 bg-ink-900 p-8 transition-colors hover:border-gold-500"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs tracking-widest text-paper-400 uppercase">
              Chat
            </span>
            <span className="text-gold-500 transition-transform group-hover:translate-x-1">
              →
            </span>
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold text-paper-100">
              Mensagens em tempo real
            </h2>
            <p className="mt-2 text-sm text-paper-400">
              Salas com Socket.IO, histórico persistido, presença de usuários e
              indicador de digitação ao vivo.
            </p>
          </div>
        </Link>
      </section>

      <section className="grid gap-8 border-t border-ink-700 py-16 sm:grid-cols-3">
        <StackItem label="Frontend" value="Next.js · TypeScript · Tailwind" />
        <StackItem label="Tempo real" value="Socket.IO sobre servidor Node" />
        <StackItem label="Dados" value="Prisma + SQLite · API BCB (SGS)" />
      </section>
    </div>
  );
}

function StackItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-xs tracking-widest text-paper-400 uppercase">{label}</p>
      <p className="mt-1 text-sm text-paper-100">{value}</p>
    </div>
  );
}
