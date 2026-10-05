import { prisma } from "@/lib/prisma";
import type { ChatMessage } from "./types";
import type { Message } from "@prisma/client";

/** Histórico carregado ao entrar na sala — evita trazer a tabela inteira. */
const HISTORY_PAGE_SIZE = 50;
const MAX_HISTORY_PAGE_SIZE = 100;

/** Retenção: mensagens de chat público não precisam viver para sempre. */
const RETENTION_DAYS = 7;

function serialize(message: Message): ChatMessage {
  return {
    id: message.id,
    room: message.room,
    author: message.author,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  };
}

export async function getRecentMessages(
  room: string,
  take = HISTORY_PAGE_SIZE,
): Promise<ChatMessage[]> {
  const messages = await prisma.message.findMany({
    where: { room },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(take, 1), MAX_HISTORY_PAGE_SIZE),
  });
  return messages.reverse().map(serialize);
}

export async function saveMessage(
  room: string,
  author: string,
  content: string,
): Promise<ChatMessage> {
  const message = await prisma.message.create({
    data: { room, author, content },
  });
  return serialize(message);
}

/** Apaga mensagens além do período de retenção. Chamado periodicamente pelo servidor. */
export async function purgeExpiredMessages(): Promise<number> {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const { count } = await prisma.message.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  return count;
}
