"use client";

import { useState } from "react";
import clsx from "clsx";
import { CHAT_ROOMS } from "@/lib/chat/types";
import { useChat } from "@/lib/chat/useChat";
import { useNickname } from "@/lib/chat/useNickname";
import { NicknameGate } from "./NicknameGate";
import { MessageList } from "./MessageList";
import { Composer } from "./Composer";
import { ASSISTANT_NAME } from "@/lib/assistant/types";

const EXEMPLOS = [
  "@bcb como está a Selic?",
  "@bcb quanto rendem R$ 5.000 no CDI?",
  "@bcb a inflação está acima da meta?",
];

export function ChatApp() {
  const { nickname, save, clear } = useNickname();
  const [room, setRoom] = useState<string>(CHAT_ROOMS[0]);

  const { messages, systemLog, presence, typingUsers, connected, rejection, sendMessage, setTyping } =
    useChat({ room, username: nickname });

  if (!nickname) {
    return (
      <div className="py-10">
        <NicknameGate onSubmit={save} />
      </div>
    );
  }

  const others = typingUsers.filter((name) => name !== nickname);
  const lastSystem = systemLog[systemLog.length - 1];

  return (
    <div className="grid gap-px border border-rule bg-rule lg:grid-cols-[13.5rem_1fr]">
      <aside className="flex flex-col gap-7 bg-sunk p-5">
        <div>
          <p className="label">Salas</p>
          <ul className="mt-3 flex flex-col">
            {CHAT_ROOMS.map((item) => {
              const ativa = item === room;
              return (
                <li key={item}>
                  <button
                    type="button"
                    onClick={() => setRoom(item)}
                    aria-current={ativa ? "true" : undefined}
                    className={clsx(
                      "focus-ring flex w-full items-center gap-2.5 border-l-2 py-2 pl-3 text-left text-sm transition-colors",
                      ativa
                        ? "border-signal bg-surface font-medium text-ink"
                        : "border-transparent text-muted hover:text-ink",
                    )}
                  >
                    {item}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <p className="label">Na sala · {presence.length + 1}</p>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            <li className="flex items-baseline gap-2">
              <span className="size-1.5 shrink-0 translate-y-[-1px] rounded-full bg-signal" />
              <span className="text-signal">{ASSISTANT_NAME}</span>
              <span className="font-mono text-[0.625rem] text-muted">assistente</span>
            </li>
            {presence.map((user, index) => (
              <li key={`${user}-${index}`} className="flex items-baseline gap-2">
                <span className="size-1.5 shrink-0 translate-y-[-1px] rounded-full bg-up" />
                <span className={user === nickname ? "font-medium text-ink" : "text-muted"}>
                  {user}
                </span>
                {user === nickname && (
                  <span className="font-mono text-[0.625rem] text-muted">você</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={clear}
          className="focus-ring mt-auto self-start text-xs text-muted underline decoration-rule-strong underline-offset-2 transition-colors hover:text-ink"
        >
          Trocar apelido
        </button>
      </aside>

      <section className="flex h-[68vh] min-h-[480px] flex-col bg-paper">
        <header className="flex items-center justify-between gap-4 border-b border-rule bg-surface px-5 py-3.5 sm:px-6">
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold tracking-[-0.02em]">{room}</h2>
            <p className="h-4 truncate text-xs text-muted">
              {others.length > 0
                ? `${others.join(", ")} ${others.length === 1 ? "está" : "estão"} digitando…`
                : lastSystem?.text}
            </p>
          </div>
          <span
            className={clsx(
              "flex shrink-0 items-center gap-2 font-mono text-[0.625rem] tracking-wider uppercase",
              connected ? "text-muted" : "text-down",
            )}
          >
            <span
              className={clsx(
                "size-1.5 rounded-full",
                connected ? "bg-up" : "bg-down",
              )}
            />
            {connected ? "conectado" : "reconectando"}
          </span>
        </header>

        <MessageList messages={messages} currentUser={nickname} />

        <div className="flex flex-wrap items-center gap-2 border-t border-rule px-5 py-3 sm:px-6">
          <span className="label">Pergunte</span>
          {EXEMPLOS.map((exemplo) => (
            <button
              key={exemplo}
              type="button"
              onClick={() => sendMessage(exemplo)}
              className="focus-ring border border-rule px-2.5 py-1 text-xs text-muted transition-colors hover:border-signal hover:text-signal"
            >
              {exemplo.replace("@bcb ", "")}
            </button>
          ))}
        </div>

        {rejection && (
          <p
            role="status"
            className="border-t-2 border-down bg-down/5 px-5 py-2.5 text-xs text-down sm:px-6"
          >
            {rejection}
          </p>
        )}

        <Composer disabled={!connected} onSend={sendMessage} onTyping={setTyping} />
      </section>
    </div>
  );
}
