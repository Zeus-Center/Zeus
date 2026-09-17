// Second Brain normalizer for ChatGPT data export (`conversations.json`).
//
// ChatGPT exports an array of conversations whose `mapping` is a message tree.
// We walk the `current_node` parent chain to reconstruct the main thread, then
// fall back to a time-ordered view of every message when no current node exists.

import type { ConversationRecord, NormalizeResult } from "../types.ts";
import { asString, isRecord, toIsoDate, formatTimestamp } from "./shared.ts";

type ChatGptMessageContent = {
  parts?: unknown[];
  content?: unknown;
  text?: unknown;
};

type ChatGptAuthor = {
  role?: unknown;
  name?: unknown;
};

type ChatGptNode = {
  id?: unknown;
  parent?: unknown;
  children?: unknown;
  message?: {
    id?: unknown;
    author?: ChatGptAuthor | unknown;
    create_time?: unknown;
    content?: ChatGptMessageContent | string | unknown;
    metadata?: unknown;
  } | null;
};

type ChatGptConversation = {
  title?: unknown;
  conversation_id?: unknown;
  create_time?: unknown;
  update_time?: unknown;
  current_node?: unknown;
  mapping?: Record<string, ChatGptNode> | unknown;
};

function extractChatGptText(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }
  if (!isRecord(content)) {
    return "";
  }
  const parts = content.parts;
  if (Array.isArray(parts)) {
    return parts
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
  return asString(content.text) ?? asString(content.content) ?? "";
}

function mapChatGptRole(role: string | undefined): ConversationRecord["messages"][number]["role"] {
  switch (role) {
    case "assistant":
      return "assistant";
    case "user":
      return "user";
    case "system":
    case "developer":
      return "system";
    case "tool":
    case "function":
      return "tool";
    default:
      return "assistant";
  }
}

function collectNodeMessage(node: ChatGptNode | undefined): {
  id: string;
  text: string;
  role: ConversationRecord["messages"][number]["role"];
  name?: string;
  createdAt?: string;
} | undefined {
  if (!node || !node.message) {
    return undefined;
  }
  const message = node.message;
  const author = isRecord(message.author) ? (message.author as ChatGptAuthor) : undefined;
  const text = extractChatGptText(message.content);
  if (text.trim().length === 0 && !author) {
    return undefined;
  }
  const id = asString(message.id) ?? asString(node.id) ?? "";
  const role = mapChatGptRole(asString(author?.role));
  const name = asString(author?.name);
  return {
    id,
    text,
    role,
    ...(name ? { name } : {}),
    createdAt: formatTimestamp(message.create_time),
  };
}

/** Walks parent pointers from the current node back to the root, returning the main thread. */
function walkMainPath(mapping: Record<string, ChatGptNode>, current: string): string[] {
  const path: string[] = [];
  const visited = new Set<string>();
  let cursor: string | undefined = current;
  while (cursor && !visited.has(cursor)) {
    visited.add(cursor);
    path.push(cursor);
    const node = mapping[cursor];
    cursor = asString(node?.parent);
  }
  return path.reverse();
}

function buildMessages(
  mapping: Record<string, ChatGptNode>,
  currentNode: string | undefined,
): ConversationRecord["messages"] {
  const byId = new Map<string, ReturnType<typeof collectNodeMessage>>();
  for (const [nodeId, node] of Object.entries(mapping)) {
    const collected = collectNodeMessage(node);
    if (collected) {
      byId.set(nodeId, collected);
    }
  }

  // Prefer the main thread reconstructed from current_node.
  if (currentNode && mapping[currentNode]) {
    const path = walkMainPath(mapping, currentNode);
    const main: ConversationRecord["messages"] = [];
    for (const nodeId of path) {
      const collected = byId.get(nodeId);
      if (collected) {
        main.push({
          role: collected.role,
          text: collected.text,
          ...(collected.name ? { name: collected.name } : {}),
          ...(collected.createdAt ? { createdAt: collected.createdAt } : {}),
        });
      }
    }
    if (main.length > 0) {
      return main;
    }
  }

  // Fallback: time-ordered view of every message (branches included).
  const ordered = [...byId.entries()]
    .map(([nodeId, collected]) => ({ nodeId, collected }))
    .sort((left, right) => {
      const leftTime = left.collected?.createdAt ?? "";
      const rightTime = right.collected?.createdAt ?? "";
      return leftTime.localeCompare(rightTime) || left.nodeId.localeCompare(right.nodeId);
    });
  return ordered.map(({ collected }) => ({
    role: collected!.role,
    text: collected!.text,
    ...(collected!.name ? { name: collected!.name } : {}),
    ...(collected!.createdAt ? { createdAt: collected!.createdAt } : {}),
  }));
}

function normalizeChatGptConversation(
  value: unknown,
  index: number,
): ConversationRecord | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const conversation = value as ChatGptConversation;
  const mapping = isRecord(conversation.mapping)
    ? (conversation.mapping as Record<string, ChatGptNode>)
    : {};
  if (Object.keys(mapping).length === 0) {
    return undefined;
  }
  const id = asString(conversation.conversation_id) ?? `chatgpt-${index + 1}`;
  const title = asString(conversation.title)?.trim() || `ChatGPT conversation ${index + 1}`;
  const currentNode = asString(conversation.current_node);
  const messages = buildMessages(mapping, currentNode);
  if (messages.length === 0) {
    return undefined;
  }
  return {
    source: "chatgpt",
    id,
    title,
    createdAt: toIsoDate(conversation.create_time) ?? messages[0]?.createdAt?.slice(0, 10),
    updatedAt: toIsoDate(conversation.update_time),
    messages,
  };
}

export function normalizeChatGpt(input: unknown): NormalizeResult {
  const warnings: string[] = [];
  const conversations: ConversationRecord[] = [];

  // Tolerate top-level wrappers: array, {conversations: [...]}, {items: [...]}.
  const list = Array.isArray(input)
    ? input
    : isRecord(input) && Array.isArray(input.conversations)
      ? input.conversations
      : isRecord(input) && Array.isArray(input.items)
        ? input.items
        : undefined;

  if (!list) {
    return {
      source: "chatgpt",
      conversations,
      warnings: ["Unrecognized ChatGPT export shape (expected an array of conversations)."],
    };
  }

  list.forEach((value, index) => {
    try {
      const record = normalizeChatGptConversation(value, index);
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
    warnings.push("No conversations found in the ChatGPT export.");
  }
  return { source: "chatgpt", conversations, warnings };
}
