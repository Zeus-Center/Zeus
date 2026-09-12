// Second Brain shared types for conversation normalization and import.
// This module is dependency-free so it can run under plain Node (type-stripped)
// as well as inside the compiled OpenClaw extension.

export type SecondBrainSourceId = "chatgpt" | "claude-ai" | "gemini";

export type ConversationMessage = {
  role: "user" | "assistant" | "system" | "tool";
  /** Optional speaker label (e.g. a tool name or a Claude model id). */
  name?: string;
  text: string;
  /** ISO-8601 timestamp when the message was sent, when the export provides one. */
  createdAt?: string;
};

export type ConversationRecord = {
  source: SecondBrainSourceId;
  id: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
  messages: ConversationMessage[];
};

export type NormalizeResult = {
  source: SecondBrainSourceId;
  conversations: ConversationRecord[];
  warnings: string[];
};

export type ImportFileResult = {
  source: SecondBrainSourceId;
  conversationId: string;
  relativePath: string;
  messageCount: number;
  status: "created" | "skipped" | "error";
  reason?: string;
};

export type ImportReport = {
  source: SecondBrainSourceId;
  files: ImportFileResult[];
  redactions: number;
  created: number;
  skipped: number;
  errors: number;
};

export const SECOND_BRAIN_SOURCE_IDS = ["chatgpt", "claude-ai", "gemini"] as const;

export function isSecondBrainSourceId(value: unknown): value is SecondBrainSourceId {
  return (
    typeof value === "string" &&
    (SECOND_BRAIN_SOURCE_IDS as readonly string[]).includes(value)
  );
}

export const SECOND_BRAIN_SOURCE_LABELS: Record<SecondBrainSourceId, string> = {
  chatgpt: "ChatGPT",
  "claude-ai": "Claude.ai",
  gemini: "Gemini",
};

export const SECOND_BRAIN_SPEAKER_LABELS: Record<SecondBrainSourceId, string> = {
  chatgpt: "ChatGPT",
  "claude-ai": "Claude",
  gemini: "Gemini",
};
