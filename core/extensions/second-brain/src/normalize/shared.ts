// Second Brain shared helpers: slugging, redaction, Markdown rendering.
// Dependency-free so it runs under plain Node (type-stripped) and in the compiled plugin.

import { createHash } from "node:crypto";
import type { ConversationRecord } from "../types.ts";
import { SECOND_BRAIN_SPEAKER_LABELS } from "../types.ts";

const MAX_SLUG_LENGTH = 64;

/** Lowercases and collapses any non-alphanumeric run into a single dash. */
export function slugify(value: string): string {
  const slug = value
    .normalize("NFKD")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, "-")
    .replaceAll(/^-+|-+$/gu, "");
  return slug.slice(0, MAX_SLUG_LENGTH) || "conversation";
}

/** Short (8-hex) stable hash used to keep file names unique per conversation id. */
export function shortHash(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 8);
}

/** Converts a unix-seconds number or an ISO string into `YYYY-MM-DD`. */
export function toIsoDate(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    // ChatGPT uses unix seconds; assume that when the value predates year 2000 in ms.
    const millis = value < 1e11 ? value * 1000 : value;
    const date = new Date(millis);
    if (Number.isNaN(date.getTime())) {
      return undefined;
    }
    return date.toISOString().slice(0, 10);
  }
  if (typeof value === "string" && value.length > 0) {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString().slice(0, 10);
    }
    const match = /^\d{4}-\d{2}-\d{2}/u.exec(value.trim());
    if (match) {
      return match[0];
    }
  }
  return undefined;
}

/** Formats an ISO date-ish value into a human `YYYY-MM-DD HH:mm` string. */
export function formatTimestamp(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    const millis = value < 1e11 ? value * 1000 : value;
    const date = new Date(millis);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }
  if (typeof value === "string" && value.length > 0) {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? undefined : new Date(parsed).toISOString();
  }
  return undefined;
}

// Conservative redaction patterns. These are intentionally broad enough to catch
// the most common accidental-secret shapes in chat exports, while avoiding false
// positives on ordinary prose. Imported third-party content is never promoted into
// MEMORY.md automatically, so this is a defense-in-depth step, not the only guard.
const SECRET_PATTERNS: ReadonlyArray<{ label: string; pattern: RegExp }> = [
  { label: "openai-key", pattern: /\bsk-[A-Za-z0-9_-]{16,}\b/gu },
  { label: "github-token", pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/gu },
  { label: "slack-token", pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/gu },
  { label: "aws-key", pattern: /\bAKIA[0-9A-Z]{16}\b/gu },
  { label: "google-key", pattern: /\bAIza[0-9A-Za-z_-]{30,}\b/gu },
  { label: "jwt", pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/gu },
  { label: "bearer", pattern: /\bBearer\s+[A-Za-z0-9._-]{10,}\b/gu },
  { label: "password", pattern: /\b(password|passwd|pwd)\s*[:=]\s*\S+/giu },
];

export type RedactionResult = {
  text: string;
  count: number;
};

export function redactSecrets(text: string): RedactionResult {
  let result = text;
  let count = 0;
  for (const { pattern } of SECRET_PATTERNS) {
    pattern.lastIndex = 0;
    result = result.replaceAll(pattern, () => {
      count += 1;
      return "[redacted]";
    });
  }
  return { text: result, count };
}

function escapeHeading(text: string): string {
  return text.replaceAll("\n", " ").replaceAll(/^\s*#+/gu, "").trim();
}

function renderBlockQuote(text: string): string {
  return text
    .split("\n")
    .map((line) => (line.trim().length === 0 ? ">" : `> ${line}`))
    .join("\n");
}

/**
 * Renders one conversation as a Markdown note. Redacts secrets inline and
 * returns the number of redactions so the importer can report it.
 */
export function renderConversationMarkdown(
  record: ConversationRecord,
): { markdown: string; redactions: number } {
  const speaker = SECOND_BRAIN_SPEAKER_LABELS[record.source];
  const lines: string[] = [];
  lines.push(`# ${escapeHeading(record.title) || "Untitled conversation"}`);
  lines.push("");
  lines.push(
    renderBlockQuote(
      `Imported ${record.source} conversation history — read-only archive. ` +
        "Searchable via memory_search; never merged into bootstrap MEMORY.md.",
    ),
  );
  lines.push("");
  lines.push("| Field | Value |");
  lines.push("| --- | --- |");
  lines.push(`| Source | ${record.source} |`);
  lines.push(`| Conversation id | \`${record.id}\` |`);
  if (record.createdAt) {
    lines.push(`| Created | ${record.createdAt} |`);
  }
  if (record.updatedAt) {
    lines.push(`| Updated | ${record.updatedAt} |`);
  }
  lines.push(`| Messages | ${record.messages.length} |`);
  lines.push("");

  let redactions = 0;
  for (const message of record.messages) {
    const { text, count } = redactSecrets(message.text);
    redactions += count;
    const label =
      message.role === "assistant"
        ? speaker
        : message.role === "system"
          ? "System"
          : message.role === "tool"
            ? `Tool${message.name ? ` (${message.name})` : ""}`
            : "You";
    const when = message.createdAt ? ` — ${message.createdAt}` : "";
    lines.push(`## ${label}${when}`);
    lines.push("");
    lines.push(text.trim().length > 0 ? text.trim() : "_(empty message)_");
    lines.push("");
  }

  return { markdown: lines.join("\n").replaceAll(/\n{3,}/gu, "\n\n"), redactions };
}

/** Builds a stable, collision-resistant file name for a conversation. */
export function conversationFileName(record: ConversationRecord): string {
  const date = record.createdAt?.slice(0, 10) ?? "undated";
  return `${date}-${slugify(record.title)}-${shortHash(record.id)}.md`;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Reads a text field defensively from an unknown export object. */
export function asString(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return undefined;
}
