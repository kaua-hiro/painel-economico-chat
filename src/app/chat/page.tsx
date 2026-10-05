import type { Metadata } from "next";
import { ChatApp } from "@/components/chat/ChatApp";

export const metadata: Metadata = {
  title: "Chat em tempo real — Socket.IO",
  description:
    "Chat multi-sala em tempo real com Socket.IO, histórico persistido em SQLite, presença e indicador de digitação.",
};

export default function ChatPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10 flex flex-col gap-3">
        <span className="font-mono text-xs tracking-[0.2em] text-gold-500 uppercase">
          WebSockets — Socket.IO sobre servidor Node
        </span>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Chat em tempo real
        </h1>
        <p className="max-w-2xl text-sm text-paper-400">
          Abra esta página em duas janelas para ver as mensagens, a presença e o
          indicador de digitação sincronizando. O histórico de cada sala é gravado
          com Prisma e recarregado ao entrar.
        </p>
      </header>

      <ChatApp />
    </div>
  );
}
