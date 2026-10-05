export interface ChatMessage {
  id: string;
  room: string;
  author: string;
  content: string;
  createdAt: string;
  /** Presente só nas respostas do assistente: diz se veio do modelo ou do motor local. */
  assistantMode?: "claude" | "local";
}

export interface JoinRoomPayload {
  room: string;
  username: string;
}

export interface SendMessagePayload {
  content: string;
}

export interface TypingPayload {
  username: string;
  isTyping: boolean;
}

export const CHAT_ROOMS = ["Geral", "Projetos", "Dúvidas"] as const;
export type ChatRoom = (typeof CHAT_ROOMS)[number];
