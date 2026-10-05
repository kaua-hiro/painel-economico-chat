import { CHAT_ROOMS, type ChatRoom } from "./types";

export const LIMITS = {
  nicknameMin: 2,
  nicknameMax: 24,
  messageMax: 1000,
} as const;

/** Apelido: letras, números, espaço simples, hífen, underline e ponto. */
const NICKNAME_PATTERN = /^[\p{L}\p{N} ._-]+$/u;

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; reason: string };

/**
 * Toda entrada do WebSocket é tratada como hostil: o cliente pode emitir
 * qualquer payload, inclusive tipos errados, ausentes ou gigantes.
 */
export function validateRoom(input: unknown): ValidationResult<ChatRoom> {
  if (typeof input !== "string") {
    return { ok: false, reason: "Sala inválida." };
  }
  const room = CHAT_ROOMS.find((candidate) => candidate === input);
  if (!room) {
    return { ok: false, reason: "Sala inexistente." };
  }
  return { ok: true, value: room };
}

export function validateNickname(input: unknown): ValidationResult<string> {
  if (typeof input !== "string") {
    return { ok: false, reason: "Apelido inválido." };
  }
  const nickname = input.trim();
  if (nickname.length < LIMITS.nicknameMin || nickname.length > LIMITS.nicknameMax) {
    return {
      ok: false,
      reason: `O apelido precisa ter de ${LIMITS.nicknameMin} a ${LIMITS.nicknameMax} caracteres.`,
    };
  }
  if (!NICKNAME_PATTERN.test(nickname)) {
    return { ok: false, reason: "O apelido tem caracteres não permitidos." };
  }
  return { ok: true, value: nickname };
}

export function validateMessage(input: unknown): ValidationResult<string> {
  if (typeof input !== "string") {
    return { ok: false, reason: "Mensagem inválida." };
  }
  const content = input.trim();
  if (content.length === 0) {
    return { ok: false, reason: "Mensagem vazia." };
  }
  if (content.length > LIMITS.messageMax) {
    return { ok: false, reason: `A mensagem passa de ${LIMITS.messageMax} caracteres.` };
  }
  return { ok: true, value: content };
}

/** Extrai um campo de um payload que pode ser qualquer coisa, inclusive null. */
export function field(payload: unknown, key: string): unknown {
  if (typeof payload !== "object" || payload === null) return undefined;
  return (payload as Record<string, unknown>)[key];
}
