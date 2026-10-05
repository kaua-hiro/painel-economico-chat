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
      <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-paper-400">
        Nenhuma mensagem nesta sala ainda. Escreva a primeira.
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-6">
      {messages.map((message) => {
        const mine = message.author === currentUser;
        const doAssistente = message.author === ASSISTANT_NAME;

        return (
          <div
            key={message.id}
            className={clsx("flex flex-col gap-1", mine ? "items-end" : "items-start")}
          >
            <div className="flex items-baseline gap-2 text-[11px] text-paper-400">
              <span
                className={clsx(
                  doAssistente ? "text-signal-up" : mine ? "text-gold-400" : "text-paper-100",
                )}
              >
                {mine ? "você" : message.author}
              </span>
              {doAssistente && (
                <span className="rounded border border-signal-up/40 px-1 font-mono text-[9px] tracking-wide text-signal-up uppercase">
                  {message.assistantMode === "claude" ? "Claude" : "dados do BCB"}
                </span>
              )}
              <span className="font-mono tabular">{formatTime(message.createdAt)}</span>
            </div>
            <p
              className={clsx(
                "max-w-[78%] rounded-xl px-4 py-2.5 text-sm leading-relaxed break-words whitespace-pre-line",
                doAssistente
                  ? "bg-signal-up/10 text-paper-100 ring-1 ring-signal-up/30"
                  : mine
                    ? "bg-gold-500/15 text-paper-100 ring-1 ring-gold-500/30"
                    : "bg-ink-800 text-paper-100 ring-1 ring-ink-600",
              )}
            >
              {message.content}
            </p>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
