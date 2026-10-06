"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";
import type { ChatMessage } from "@/lib/chat/types";
import { ASSISTANT_NAME } from "@/lib/assistant/types";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * A assinatura da direção: a resposta do assistente não é um balão de chat, é
 * uma leitura de instrumento. Mesma linguagem de célula do painel — tarja mono
 * com a origem, texto em escala de leitura com algarismos tabulares. Isso torna
 * visível a tese do projeto: o @bcb não conversa sobre economia, ele lê o mesmo
 * instrumento que o painel mostra.
 */
function Leitura({ message }: { message: ChatMessage }) {
  const doModelo = message.assistantMode === "claude";

  return (
    <article className="rise border-l-2 border-signal bg-surface">
      <header className="flex items-baseline justify-between gap-3 border-b border-rule px-4 py-2">
        <span className="label text-signal">{ASSISTANT_NAME}</span>
        <span className="font-mono text-[0.625rem] tracking-wider text-muted uppercase">
          {doModelo ? "via Claude" : "dados do BCB"} · {formatTime(message.createdAt)}
        </span>
      </header>
      <p className="tabular px-4 py-3.5 text-[0.9375rem] leading-relaxed break-words whitespace-pre-line">
        {message.content}
      </p>
    </article>
  );
}

function Fala({ message, mine }: { message: ChatMessage; mine: boolean }) {
  return (
    <article className="rise flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <span
          className={clsx(
            "text-xs font-medium",
            mine ? "text-signal" : "text-ink",
          )}
        >
          {mine ? "você" : message.author}
        </span>
        <span className="tabular font-mono text-[0.625rem] text-muted">
          {formatTime(message.createdAt)}
        </span>
      </div>
      <p
        className={clsx(
          "max-w-[62ch] text-sm leading-relaxed break-words whitespace-pre-line",
          mine ? "text-ink" : "text-ink",
        )}
      >
        {message.content}
      </p>
    </article>
  );
}

export function MessageList({
  messages,
  currentUser,
}: {
  messages: ChatMessage[];
  currentUser: string;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="label">Sala vazia</p>
        <p className="max-w-xs text-sm text-muted">
          Escreva a primeira mensagem, ou mencione o {ASSISTANT_NAME} para ver uma leitura
          do Banco Central aparecer aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-6 sm:px-6">
      {messages.map((message) =>
        message.author === ASSISTANT_NAME ? (
          <Leitura key={message.id} message={message} />
        ) : (
          <Fala key={message.id} message={message} mine={message.author === currentUser} />
        ),
      )}
      <div ref={bottomRef} />
    </div>
  );
}
