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
      <header className="mb-10 flex flex-col gap-4">
        <p className="label">WebSockets — Socket.IO sobre servidor Node</p>
        <h1 className="font-display text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">
          Chat em tempo real
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          Abra esta página em duas janelas para ver as mensagens, a presença e o
          indicador de digitação sincronizando. O histórico de cada sala é gravado
          com Prisma e recarregado ao entrar.
        </p>
      </header>

      <ChatApp />
    </div>
  );
}
