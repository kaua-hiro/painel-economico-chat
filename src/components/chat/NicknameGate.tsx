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
      className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-xl border border-ink-700 bg-ink-900 p-8"
    >
      <div>
        <h2 className="font-display text-xl font-semibold">Escolha um apelido</h2>
        <p className="mt-1 text-sm text-paper-400">
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
        className="focus-ring rounded-lg border border-ink-600 bg-ink-800 px-4 py-2.5 text-sm text-paper-100 placeholder:text-paper-400/60"
      />
      {error && (
        <p role="alert" className="text-xs text-signal-down">
          {error}
        </p>
      )}
      {/* Sempre habilitado: a validação acontece no envio e explica o motivo,
          o que evita um botão morto sem feedback e mantém servidor e cliente
          renderizando o mesmo atributo. */}
      <button
        type="submit"
        className="focus-ring rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-medium text-ink-950"
      >
        Entrar no chat
      </button>
    </form>
  );
}
