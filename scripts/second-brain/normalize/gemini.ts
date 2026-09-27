// Second Brain normalizers for Gemini history exported via Google Takeout.
//
// Takeout ships Gemini history in two shapes:
//   * a `conversations.json` array (preferred), and
//   * a folder of `Chat-*.html` pages (legacy). The HTML shape is parsed with a
//     best-effort extractor for `query-text` (user) and `model-response-text`
//     (assistant) blocks. Prefer the JSON export when it is available.

import type { ConversationRecord, NormalizeResult } from "../types.ts";
import { asString, isRecord, toIsoDate } from "./shared.ts";

// --- JSON shape -------------------------------------------------------------

type GeminiMessage = {
  role?: unknown;
  author?: unknown;
  content?: unknown;
  text?: unknown;
  parts?: unknown;
  timestamp?: unknown;
};

type GeminiConversation = {
  id?: unknown;
  conversation_id?: unknown;
  title?: unknown;
  name?: unknown;
  create_time?: unknown;
  update_time?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  messages?: unknown;
  turns?: unknown;
};

function extractGeminiJsonText(message: GeminiMessage): string {
  const direct = asString(message.text) ?? asString(message.content);
  if (direct !== undefined && direct.trim().length > 0) {
    return direct;
  }
  if (Array.isArray(message.parts)) {
    return message.parts
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }
        if (isRecord(part)) {
          return asString(part.text) ?? asString(part.content) ?? "";
        }
        return "";
      })
      .filter((part) => part.length > 0)
      .join("\n");
  }
  return "";
}

function geminiRoleOf(message: GeminiMessage): "user" | "assistant" {
  const role = asString(message.role) ?? asString(message.author);
  return role === "user" || role === "human" ? "user" : "assistant";
}

function normalizeGeminiConversation(value: unknown, index: number): ConversationRecord | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const conversation = value as GeminiConversation;
  const rawMessages = Array.isArray(conversation.messages)
    ? conversation.messages
    : Array.isArray(conversation.turns)
      ? conversation.turns
      : undefined;
  if (!rawMessages || rawMessages.length === 0) {
    return undefined;
  }
  const messages: ConversationRecord["messages"] = [];
  for (const raw of rawMessages) {
    if (!isRecord(raw)) {
      continue;
    }
    const message = raw as GeminiMessage;
    const text = extractGeminiJsonText(message);
    if (text.trim().length === 0) {
      continue;
    }
    messages.push({
      role: geminiRoleOf(message),
      text,
      ...(asString(message.timestamp)
        ? { createdAt: toIsoDate(message.timestamp) ?? undefined }
        : {}),
    });
  }
  if (messages.length === 0) {
    return undefined;
  }
  const id =
    asString(conversation.id) ?? asString(conversation.conversation_id) ?? `gemini-${index + 1}`;
  return {
    source: "gemini",
    id,
    title:
      asString(conversation.title)?.trim() ||
      asString(conversation.name)?.trim() ||
      `Gemini conversation ${index + 1}`,
    createdAt:
      toIsoDate(conversation.create_time) ??
      toIsoDate(conversation.createdAt) ??
      messages[0]?.createdAt?.slice(0, 10),
    updatedAt: toIsoDate(conversation.update_time) ?? toIsoDate(conversation.updatedAt),
    messages,
  };
}

export function normalizeGeminiJson(input: unknown): NormalizeResult {
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
      source: "gemini",
      conversations,
      warnings: ["Unrecognized Gemini export shape (expected an array of conversations)."],
    };
  }
  list.forEach((value, index) => {
    try {
      const record = normalizeGeminiConversation(value, index);
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
    warnings.push("No conversations found in the Gemini export.");
  }
  return { source: "gemini", conversations, warnings };
}

// --- Legacy Takeout HTML shape ---------------------------------------------

function decodeHtmlEntities(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&nbsp;", " ");
}

function stripTags(value: string): string {
  return value
    .replaceAll(/<br\s*\/?>/giu, "\n")
    .replaceAll(/<\/(p|div|li|tr)>/giu, "\n")
    .replaceAll(/<[^>]+>/gu, "")
    .replaceAll(/\n{3,}/gu, "\n\n");
}

/** Extracts `class="query-text"` and `class="model-response-text"` blocks. */
function extractHtmlBlocks(
  html: string,
  className: string,
): string[] {
  const results: string[] = [];
  // Tolerant pattern: a div (or any tag) carrying the class, up to its closing tag.
  const open = new RegExp(`<[^>]+class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>`, "giu");
  const tagPattern = /<(\w+)[^>]*>/giu;
  let searchFrom = 0;
  while (true) {
    open.lastIndex = searchFrom;
    const match = open.exec(html);
    if (!match) {
      break;
    }
    const tagStart = match.index;
    const afterOpen = open.lastIndex;
    // Determine the opening tag name to match its closing tag.
    tagPattern.lastIndex = tagStart;
    const tagMatch = tagPattern.exec(html);
    const tagName = tagMatch?.[1]?.toLowerCase() ?? "div";
    const closing = `</${tagName}>`;
    const closeIndex = html.indexOf(closing, afterOpen);
    const end = closeIndex === -1 ? html.length : closeIndex;
    const inner = html.slice(afterOpen, end);
    results.push(decodeHtmlEntities(stripTags(inner)).trim());
    searchFrom = closeIndex === -1 ? html.length : closeIndex + closing.length;
  }
  return results.filter((block) => block.length > 0);
}

/** Extracts the page title, preferring `class="conversation-title"`. */
function extractHtmlTitle(html: string, fallback: string): string {
  const titleTag = /<title[^>]*>([\s\S]*?)<\/title>/iu.exec(html);
  const title =
    titleTag?.[1] !== undefined ? decodeHtmlEntities(stripTags(titleTag[1])).trim() : "";
  if (title.length > 0) {
    return title;
  }
  const header = /class=["'][^"']*conversation-title[^"']*["'][^>]*>([\s\S]*?)<\//iu.exec(html);
  const headerText =
    header?.[1] !== undefined ? decodeHtmlEntities(stripTags(header[1])).trim() : "";
  return headerText.length > 0 ? headerText : fallback;
}

export function extractGeminiHtml(html: string, id: string): ConversationRecord | undefined {
  const queries = extractHtmlBlocks(html, "query-text");
  const responses = extractHtmlBlocks(html, "model-response-text");
  const messages: ConversationRecord["messages"] = [];
  const maxTurns = Math.max(queries.length, responses.length);
  for (let index = 0; index < maxTurns; index += 1) {
    const query = queries[index];
    const response = responses[index];
    if (query) {
      messages.push({ role: "user", text: query });
    }
    if (response) {
      messages.push({ role: "assistant", text: response });
    }
  }
  if (messages.length === 0) {
    return undefined;
  }
  return {
    source: "gemini",
    id,
    title: extractHtmlTitle(html, `Gemini conversation ${id}`),
    messages,
  };
}
