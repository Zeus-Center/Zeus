// Second Brain normalizer for Claude.ai data export (`conversations.json`).
//
// Claude.ai exports a flat array of conversations with a `chat_messages` list,
// where each message carries `sender: "human" | "assistant"` and a `text` body.

import type { ConversationRecord, NormalizeResult } from "../types.ts";
import { asString, isRecord, toIsoDate } from "./shared.ts";

type ClaudeChatMessage = {
  text?: unknown;
  content?: unknown;
  sender?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
};

type ClaudeConversation = {
  uuid?: unknown;
  name?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
  chat_messages?: unknown;
};

function extractClaudeText(message: ClaudeChatMessage): string {
  const direct = asString(message.text);
  if (direct !== undefined && direct.trim().length > 0) {
    return direct;
  }
  const content = message.content;
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (typeof block === "string") {
          return block;
        }
        if (isRecord(block)) {
          if (block.type === "text" || block.type === "thinking") {
            return asString(block.text) ?? "";
          }
          return asString(block.text) ?? asString(block.content) ?? "";
        }
        return "";
      })
      .filter((part) => part.length > 0)
      .join("\n");
  }
  return "";
}

function normalizeClaudeConversation(value: unknown, index: number): ConversationRecord | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const conversation = value as ClaudeConversation;
  const rawMessages = conversation.chat_messages;
  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return undefined;
  }
  const messages: ConversationRecord["messages"] = [];
  for (const raw of rawMessages) {
    if (!isRecord(raw)) {
      continue;
    }
    const message = raw as ClaudeChatMessage;
    const text = extractClaudeText(message);
    if (text.trim().length === 0) {
      continue;
    }
    const sender = asString(message.sender);
    const role = sender === "human" ? "user" : "assistant";
    messages.push({
      role,
      text,
      ...(asString(message.created_at)
        ? { createdAt: toIsoDate(message.created_at) ?? undefined }
        : {}),
    });
  }
  if (messages.length === 0) {
    return undefined;
  }
  const id = asString(conversation.uuid) ?? `claude-${index + 1}`;
  return {
    source: "claude-ai",
    id,
    title: asString(conversation.name)?.trim() || `Claude conversation ${index + 1}`,
    createdAt: toIsoDate(conversation.created_at) ?? messages[0]?.createdAt?.slice(0, 10),
    updatedAt: toIsoDate(conversation.updated_at),
    messages,
  };
}

export function normalizeClaudeAi(input: unknown): NormalizeResult {
  const warnings: string[] = [];
  const conversations: ConversationRecord[] = [];

  const list = Array.isArray(input)
    ? input
    : isRecord(input) && Array.isArray(input.conversations)
      ? input.conversations
      : isRecord(input) && Array.isArray(input.items)
        ? input.items
        : undefined;

  if (!list) {
    return {
      source: "claude-ai",
      conversations,
      warnings: ["Unrecognized Claude.ai export shape (expected an array of conversations)."],
    };
  }

  list.forEach((value, index) => {
    try {
      const record = normalizeClaudeConversation(value, index);
      if (record) {
        conversations.push(record);
      }
    } catch (error) {
      warnings.push(
        `Skipped conversation #${index + 1}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  });

  if (conversations.length === 0 && warnings.length === 0) {
    warnings.push("No conversations found in the Claude.ai export.");
  }
  return { source: "claude-ai", conversations, warnings };
}
