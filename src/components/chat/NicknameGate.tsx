"use client";

import { useState } from "react";
import { LIMITS, validateNickname } from "@/lib/chat/validation";

export function NicknameGate({ onSubmit }: { onSubmit: (nickname: string) => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const result = validateNickname(value);
        if (!result.ok) {
          setError(result.reason);
          return;
        }
        setError(null);
        onSubmit(result.value);
      }}
      className="mx-auto flex w-full max-w-md flex-col gap-5 border-t-2 border-signal border-x border-b border-x-rule border-b-rule bg-surface p-8"
    >
      <div>
        <p className="label">Identificação</p>
        <h2 className="font-display mt-3 text-2xl font-semibold tracking-[-0.02em]">
          Escolha um apelido
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Ele identifica suas mensagens nas salas e fica salvo neste navegador.
        </p>
      </div>
      <input
        autoFocus
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          if (error) setError(null);
        }}
        maxLength={LIMITS.nicknameMax}
        placeholder="ex. hiro"
        aria-label="Apelido"
        autoComplete="off"
        aria-invalid={error !== null}
        className="focus-ring border border-rule bg-paper px-3.5 py-2.5 text-sm text-ink transition-colors placeholder:text-muted/70 hover:border-rule-strong focus:border-signal"
      />
      {error && (
        <p role="alert" className="text-xs text-down">
          {error}
        </p>
      )}
      {/* Sempre habilitado: a validação acontece no envio e explica o motivo,
          o que evita um botão morto sem feedback e mantém servidor e cliente
          renderizando o mesmo atributo. */}
      <button
        type="submit"
        className="focus-ring bg-signal px-4 py-2.5 text-sm font-medium text-surface transition-opacity hover:opacity-90"
      >
        Entrar no chat
      </button>
    </form>
  );
}
