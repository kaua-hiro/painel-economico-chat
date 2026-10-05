"use client";

import { useEffect, useRef, useState } from "react";
import { LIMITS } from "@/lib/chat/validation";

const TYPING_IDLE_MS = 1500;

export function Composer({
  disabled,
  onSend,
  onTyping,
}: {
  disabled: boolean;
  onSend: (content: string) => void;
  onTyping: (isTyping: boolean) => void;
}) {
  const [value, setValue] = useState("");
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);

  function handleChange(next: string) {
    setValue(next);
    onTyping(next.length > 0);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => onTyping(false), TYPING_IDLE_MS);
  }

  function handleSubmit() {
    const content = value.trim();
    if (!content) return;
    onSend(content);
    setValue("");
    onTyping(false);
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
      className="flex items-center gap-3 border-t border-ink-700 bg-ink-900 p-4"
    >
      <input
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        disabled={disabled}
        maxLength={LIMITS.messageMax}
        placeholder={disabled ? "Reconectando…" : "Escreva uma mensagem"}
        aria-label="Mensagem"
        autoComplete="off"
        className="focus-ring flex-1 rounded-lg border border-ink-600 bg-ink-800 px-4 py-2.5 text-sm text-paper-100 placeholder:text-paper-400/60 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled}
        className="focus-ring rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-medium text-ink-950 transition-opacity disabled:opacity-40"
      >
        Enviar
      </button>
    </form>
  );
}
