export function Footer() {
  return (
    <footer className="border-t border-ink-700 bg-ink-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-6 text-xs text-paper-400">
        <p>
          Dados macroeconômicos via{" "}
          <a
            href="https://dadosabertos.bcb.gov.br/"
            target="_blank"
            rel="noreferrer"
            className="focus-ring underline decoration-ink-600 hover:text-paper-100"
          >
            API de Dados Abertos do Banco Central do Brasil
          </a>
          .
        </p>
        <p>Kauã Hiro Mizumoto — projeto de portfólio.</p>
      </div>
    </footer>
  );
}
