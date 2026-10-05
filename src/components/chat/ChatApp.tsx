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
      <div className="py-12">
        <NicknameGate onSubmit={save} />
      </div>
    );
  }

  const others = typingUsers.filter((name) => name !== nickname);
  const lastSystem = systemLog[systemLog.length - 1];

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="flex flex-col gap-6">
        <div>
          <p className="font-mono text-xs tracking-widest text-paper-400 uppercase">Salas</p>
          <ul className="mt-3 flex flex-col gap-1">
            {CHAT_ROOMS.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => setRoom(item)}
                  className={clsx(
                    "focus-ring w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    item === room
                      ? "bg-ink-800 text-paper-100 ring-1 ring-gold-500/40"
                      : "text-paper-400 hover:bg-ink-900 hover:text-paper-100",
                  )}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-mono text-xs tracking-widest text-paper-400 uppercase">
            Online ({presence.length + 1})
          </p>
          <ul className="mt-3 flex flex-col gap-1.5 text-sm">
            <li className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-signal-up" />
              <span className="text-signal-up">{ASSISTANT_NAME} (assistente)</span>
            </li>
            {presence.map((user, index) => (
              <li key={`${user}-${index}`} className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-signal-up" />
                <span className={user === nickname ? "text-gold-400" : "text-paper-100"}>
                  {user === nickname ? `${user} (você)` : user}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={clear}
          className="focus-ring self-start text-xs text-paper-400 underline decoration-ink-600 hover:text-paper-100"
        >
          Trocar apelido
        </button>
      </aside>

      <section className="flex h-[70vh] min-h-[480px] flex-col overflow-hidden rounded-xl border border-ink-700 bg-ink-950">
        <header className="flex items-center justify-between gap-4 border-b border-ink-700 bg-ink-900 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold">#{room}</h2>
            <p className="h-4 text-xs text-paper-400">
              {others.length > 0
                ? `${others.join(", ")} ${others.length === 1 ? "está" : "estão"} digitando…`
                : lastSystem?.text}
            </p>
          </div>
          <span
            className={clsx(
              "flex items-center gap-2 font-mono text-[11px] uppercase",
              connected ? "text-signal-up" : "text-signal-down",
            )}
          >
            <span
              className={clsx(
                "size-1.5 rounded-full",
                connected ? "bg-signal-up" : "bg-signal-down",
              )}
            />
            {connected ? "conectado" : "offline"}
          </span>
        </header>

        <MessageList messages={messages} currentUser={nickname} />

        <div className="flex flex-wrap items-center gap-2 border-t border-ink-700 px-6 py-3">
          <span className="font-mono text-[10px] tracking-widest text-paper-400 uppercase">
            Pergunte ao {ASSISTANT_NAME}
          </span>
          {EXEMPLOS.map((exemplo) => (
            <button
              key={exemplo}
              type="button"
              onClick={() => sendMessage(exemplo)}
              className="focus-ring rounded-full border border-ink-600 px-3 py-1 text-xs text-paper-400 transition-colors hover:border-signal-up/50 hover:text-paper-100"
            >
              {exemplo}
            </button>
          ))}
        </div>
        {rejection && (
          <p
            role="status"
            className="border-t border-signal-down/40 bg-signal-down/10 px-6 py-2.5 text-xs text-signal-down"
          >
            {rejection}
          </p>
        )}
        <Composer disabled={!connected} onSend={sendMessage} onTyping={setTyping} />
      </section>
    </div>
  );
}
