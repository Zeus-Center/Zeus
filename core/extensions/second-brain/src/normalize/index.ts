// Second Brain normalizer dispatch.
import type { ConversationRecord, NormalizeResult, SecondBrainSourceId } from "../types.ts";
import { normalizeChatGpt } from "./chatgpt.ts";
import { normalizeClaudeAi } from "./claude-ai.ts";
import { extractGeminiHtml, normalizeGeminiJson } from "./gemini.ts";

export { normalizeChatGpt } from "./chatgpt.ts";
export { normalizeClaudeAi } from "./claude-ai.ts";
export { extractGeminiHtml, normalizeGeminiJson } from "./gemini.ts";
export {
  conversationFileName,
  redactSecrets,
  renderConversationMarkdown,
  slugify,
} from "./shared.ts";

export function normalizeJsonForSource(
  source: SecondBrainSourceId,
  input: unknown,
): NormalizeResult {
  switch (source) {
    case "chatgpt":
      return normalizeChatGpt(input);
    case "claude-ai":
      return normalizeClaudeAi(input);
    case "gemini":
      return normalizeGeminiJson(input);
  }
}

export function normalizeHtmlForSource(
  source: SecondBrainSourceId,
  html: string,
  id: string,
): ConversationRecord[] {
  if (source === "gemini") {
    const record = extractGeminiHtml(html, id);
    return record ? [record] : [];
  }
  return [];
}
