import { getAllIndicators } from "@/lib/bcb/service";
import { answerLocally } from "./local";
import { answerWithClaude, claudeConfigurado } from "./claude";
import type { AssistantAnswer } from "./types";

export { ASSISTANT_NAME, mentionsAssistant, stripMention } from "./types";
export type { AssistantAnswer, AssistantMode } from "./types";

const MAX_QUESTION_LENGTH = 1000;

/**
 * Responde à pergunta do visitante sobre os indicadores.
 *
 * Com ANTHROPIC_API_KEY configurada, usa a Claude API tendo as séries reais
 * como única fonte factual. Sem chave — ou se a chamada falhar — cai no motor
 * determinístico, que responde a partir dos mesmos dados. Nunca propaga erro:
 * o chat não pode quebrar porque o assistente teve problema.
 */
export async function askAssistant(rawQuestion: string): Promise<AssistantAnswer> {
  const question = rawQuestion.trim().slice(0, MAX_QUESTION_LENGTH);

  if (!question) {
    return {
      text: "Pergunte algo como: @bcb como está a Selic? ou @bcb quanto rendem R$ 5.000 no CDI?",
      mode: "local",
    };
  }

  let indicators: Awaited<ReturnType<typeof getAllIndicators>> = [];
  try {
    indicators = await getAllIndicators();
  } catch (error) {
    console.error("[assistente] não consegui carregar os indicadores:", error);
  }

  if (claudeConfigurado()) {
    try {
      return { text: await answerWithClaude(question, indicators), mode: "claude" };
    } catch (error) {
      // Sem detalhe da pergunta no log: só o motivo técnico da falha.
      console.error("[assistente] Claude indisponível, usando o motor local:", error);
    }
  }

  return { text: answerLocally(question, indicators), mode: "local" };
}
