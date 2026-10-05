/**
 * Apelido do assistente. O "@" é proibido pela validação de apelidos
 * (`src/lib/chat/validation.ts`), então nenhum visitante consegue se passar
 * por ele.
 */
export const ASSISTANT_NAME = "@bcb";

export type AssistantMode = "claude" | "local";

export interface AssistantAnswer {
  text: string;
  /** De onde veio a resposta — exibido na interface para não enganar ninguém. */
  mode: AssistantMode;
}

export function mentionsAssistant(content: string): boolean {
  return content.toLowerCase().includes(ASSISTANT_NAME);
}

/** Remove a menção para sobrar só a pergunta. */
export function stripMention(content: string): string {
  return content.replace(new RegExp(ASSISTANT_NAME, "gi"), "").trim();
}
