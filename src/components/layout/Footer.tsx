export function Footer() {
  return (
    <footer className="border-t border-rule bg-sunk">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-7 text-xs text-muted sm:flex-row sm:items-baseline sm:justify-between">
        <p>
          Séries macroeconômicas da{" "}
          <a
            href="https://dadosabertos.bcb.gov.br/"
            target="_blank"
            rel="noreferrer"
            className="focus-ring text-ink underline decoration-rule-strong underline-offset-2 transition-colors hover:decoration-signal"
          >
            API de Dados Abertos do Banco Central do Brasil
          </a>
          .
        </p>
        <p className="label">Kauã Hiro Mizumoto</p>
      </div>
    </footer>
  );
}
