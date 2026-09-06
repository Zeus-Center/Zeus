// Second Brain conversation importer.
//
// Reads a ChatGPT / Claude.ai / Gemini export (a JSON file, an HTML file, or a
// directory), normalizes it into `ConversationRecord`s, and writes one Markdown
// note per conversation under `<importsRoot>/<source>/`. Imported notes live in
// the OpenClaw memory index (searchable via `memory_search` / `memory_get`) but
// are never merged into the bootstrap `MEMORY.md`.
//
// This module is dependency-free so it can run under plain Node (type-stripped)
// for the standalone script as well as inside the compiled OpenClaw plugin.

import fs from "node:fs/promises";
import path from "node:path";
import type {
  ConversationRecord,
  ImportFileResult,
  ImportReport,
  SecondBrainSourceId,
} from "./types.ts";
import { isSecondBrainSourceId, SECOND_BRAIN_SOURCE_IDS } from "./types.ts";
import { conversationFileName, renderConversationMarkdown } from "./normalize/shared.ts";
import { normalizeHtmlForSource, normalizeJsonForSource } from "./normalize/index.ts";

export const DEFAULT_MAX_FILES = 2000;

export type SecondBrainImportOptions = {
  source: SecondBrainSourceId;
  /** File or directory containing the export. */
  from: string;
  /** Destination root, typically `<workspace>/memory/imports`. */
  importsRoot: string;
  overwrite?: boolean;
  maxFiles?: number;
  dryRun?: boolean;
};

type SourceInput = {
  kind: "json" | "html";
  filePath: string;
};

function isJsonFileName(name: string): boolean {
  return name.toLowerCase().endsWith(".json");
}

function isHtmlFileName(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.endsWith(".html") || lower.endsWith(".htm");
}

async function safeReadDir(dir: string): Promise<string[]> {
  try {
    return await fs.readdir(dir);
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: unknown }).code)
        : undefined;
    if (code === "ENOENT" || code === "ENOTDIR") {
      return [];
    }
    throw new Error(`Unable to read export directory: ${dir}`, { cause: error });
  }
}

/** Picks the export file(s) to read for a given source and input path. */
export async function resolveSourceInputs(
  source: SecondBrainSourceId,
  from: string,
): Promise<SourceInput[]> {
  const stat = await fs.stat(from).catch(() => undefined);
  if (!stat) {
    throw new Error(`Export path does not exist: ${from}`);
  }
  if (stat.isFile()) {
    if (isHtmlFileName(from)) {
      return [{ kind: "html", filePath: from }];
    }
    return [{ kind: "json", filePath: from }];
  }
  if (stat.isDirectory()) {
    const entries = (await safeReadDir(from)).toSorted((left, right) =>
      left.localeCompare(right),
    );
    if (source === "gemini") {
      const json = entries.find((name) => name.toLowerCase() === "conversations.json");
      if (json) {
        return [{ kind: "json", filePath: path.join(from, json) }];
      }
      const html = entries.filter((name) => isHtmlFileName(name));
      if (html.length === 0) {
        throw new Error(
          `No Gemini export files found in ${from}. Expected conversations.json or Chat-*.html files.`,
        );
      }
      return html.map((name) => ({ kind: "html", filePath: path.join(from, name) }));
    }
    const preferred = ["conversations.json", "claude_conversations.json"];
    for (const name of preferred) {
      if (entries.includes(name)) {
        return [{ kind: "json", filePath: path.join(from, name) }];
      }
    }
    const json = entries.filter((name) => isJsonFileName(name));
    if (json.length === 0) {
      throw new Error(`No JSON export files found in ${from}.`);
    }
    return json.map((name) => ({ kind: "json", filePath: path.join(from, name) }));
  }
  throw new Error(`Export path is neither a file nor a directory: ${from}`);
}

function parseJsonFile(contents: string, filePath: string): unknown {
  try {
    return JSON.parse(contents);
  } catch (error) {
    throw new Error(
      `Unable to parse JSON export ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function loadConversations(
  source: SecondBrainSourceId,
  inputs: SourceInput[],
): Promise<{ conversations: ConversationRecord[]; warnings: string[] }> {
  const conversations: ConversationRecord[] = [];
  const warnings: string[] = [];
  for (const input of inputs) {
    const contents = await fs.readFile(input.filePath, "utf8");
    if (input.kind === "html") {
      const records = normalizeHtmlForSource(source, contents, path.basename(input.filePath));
      conversations.push(...records);
      continue;
    }
    const parsed = parseJsonFile(contents, input.filePath);
    const result = normalizeJsonForSource(source, parsed);
    conversations.push(...result.conversations);
    warnings.push(...result.warnings);
  }
  return { conversations, warnings };
}

function emptyReport(source: SecondBrainSourceId): ImportReport {
  return { source, files: [], redactions: 0, created: 0, skipped: 0, errors: 0 };
}

export async function importSecondBrainSource(
  options: SecondBrainImportOptions,
): Promise<ImportReport> {
  if (!isSecondBrainSourceId(options.source)) {
    throw new Error(`Unknown second-brain source: ${String(options.source)}`);
  }
  const report = emptyReport(options.source);
  const inputs = await resolveSourceInputs(options.source, options.from);
  const { conversations, warnings } = await loadConversations(options.source, inputs);

  const maxFiles = options.maxFiles ?? DEFAULT_MAX_FILES;
  if (conversations.length > maxFiles) {
    throw new Error(
      `Export contains ${conversations.length} conversations; the safe import limit is ${maxFiles}. Split the source export before importing.`,
    );
  }

  for (const record of conversations) {
    const fileName = conversationFileName(record);
    const relativePath = path.posix.join(options.source, fileName);
    const absolutePath = path.join(options.importsRoot, relativePath);
    let result: ImportFileResult;
    try {
      const exists = await fs
        .stat(absolutePath)
        .then(() => true)
        .catch(() => false);
      if (exists && !options.overwrite) {
        result = {
          source: options.source,
          conversationId: record.id,
          relativePath,
          messageCount: record.messages.length,
          status: "skipped",
          reason: "already imported",
        };
      } else {
        const { markdown, redactions } = renderConversationMarkdown(record);
        report.redactions += redactions;
        if (!options.dryRun) {
          await fs.mkdir(path.dirname(absolutePath), { recursive: true });
          await fs.writeFile(absolutePath, `${markdown.trimEnd()}\n`, "utf8");
        }
        result = {
          source: options.source,
          conversationId: record.id,
          relativePath,
          messageCount: record.messages.length,
          status: "created",
        };
      }
      report.files.push(result);
    } catch (error) {
      result = {
        source: options.source,
        conversationId: record.id,
        relativePath,
        messageCount: record.messages.length,
        status: "error",
        reason: error instanceof Error ? error.message : String(error),
      };
      report.files.push(result);
    }
  }

  report.created = report.files.filter((file) => file.status === "created").length;
  report.skipped = report.files.filter((file) => file.status === "skipped").length;
  report.errors = report.files.filter((file) => file.status === "error").length;

  // Surface normalize warnings without failing the whole import.
  for (const warning of warnings) {
    report.files.push({
      source: options.source,
      conversationId: "",
      relativePath: "",
      messageCount: 0,
      status: "error",
      reason: warning,
    });
    report.errors += 1;
  }

  return report;
}

export type SourceCount = {
  source: SecondBrainSourceId;
  files: number;
  bytes: number;
};

// --- Inbox ingestion (consolidate ChatGPT + Claude.ai + Gemini in one pass) ---

export type InboxSource = {
  source: SecondBrainSourceId;
  from: string;
};

export type InboxIngestReport = {
  reports: ImportReport[];
  foundSources: SecondBrainSourceId[];
  missingSources: SecondBrainSourceId[];
  unrecognized: string[];
};

const INBOX_FILE_HINTS: ReadonlyArray<{ source: SecondBrainSourceId; matches: RegExp }> = [
  { source: "chatgpt", matches: /^(chatgpt|chat-gpt)([-_.].*)?\.json$/iu },
  { source: "claude-ai", matches: /^(claude|claude-ai|claudeai|claude_conversations)([-_.].*)?\.json$/iu },
  { source: "gemini", matches: /^(gemini|gemini-history|gemini_conversations)([-_.].*)?\.json$/iu },
];

const INBOX_DIR_HINTS: ReadonlyArray<{ source: SecondBrainSourceId; matches: RegExp }> = [
  { source: "gemini", matches: /^(gemini|takeout|gemini-takeout)$/iu },
  { source: "claude-ai", matches: /^(claude|claude-ai|claudeai|claude\.ai|claude-export)$/iu },
  { source: "chatgpt", matches: /^(chatgpt|chat-gpt|chatgpt-export|chatgpt-data)$/iu },
];

export type InboxDiscovery = {
  sources: InboxSource[];
  unrecognized: string[];
};

/**
 * Detects which second-brain exports exist under an inbox directory.
 * Recognizes clearly named files (`chatgpt.json`, `claude-ai.json`,
 * `gemini.json`, …) and folders (`chatgpt/`, `claude/`, `gemini/`,
 * `takeout/`, …). A bare `conversations.json` is intentionally not matched
 * because it is ambiguous across sources; use the per-source `import` command
 * for single files.
 */
export async function discoverInboxSources(inboxDir: string): Promise<InboxDiscovery> {
  const stat = await fs.stat(inboxDir).catch(() => undefined);
  if (!stat?.isDirectory()) {
    throw new Error(`Inbox directory does not exist or is not a directory: ${inboxDir}`);
  }
  const entries = (await safeReadDir(inboxDir)).toSorted((left, right) =>
    left.localeCompare(right),
  );
  const found = new Map<SecondBrainSourceId, string>();
  const unrecognized: string[] = [];
  for (const name of entries) {
    const full = path.join(inboxDir, name);
    const entryStat = await fs.stat(full).catch(() => undefined);
    if (entryStat?.isDirectory()) {
      const hint = INBOX_DIR_HINTS.find((candidate) => candidate.matches.test(name));
      if (hint && !found.has(hint.source)) {
        found.set(hint.source, full);
      }
      continue;
    }
    if (entryStat?.isFile() && isJsonFileName(name)) {
      const hint = INBOX_FILE_HINTS.find((candidate) => candidate.matches.test(name));
      if (hint && !found.has(hint.source)) {
        found.set(hint.source, full);
      } else if (!hint) {
        unrecognized.push(name);
      }
      continue;
    }
    if (entryStat?.isFile() && isHtmlFileName(name)) {
      // Legacy Gemini Takeout HTML is only discoverable inside a named folder.
      unrecognized.push(name);
    }
  }
  return {
    sources: [...found.entries()].map(([source, from]) => ({ source, from })),
    unrecognized,
  };
}

export type IngestSecondBrainOptions = {
  inboxDir: string;
  importsRoot: string;
  overwrite?: boolean;
  maxFiles?: number;
  dryRun?: boolean;
};

/** Imports every recognized export found in an inbox directory. */
export async function ingestSecondBrainInbox(
  options: IngestSecondBrainOptions,
): Promise<InboxIngestReport> {
  const discovered = await discoverInboxSources(options.inboxDir);
  const foundSources = discovered.sources.map((entry) => entry.source);
  const missingSources = SECOND_BRAIN_SOURCE_IDS.filter((source) => !foundSources.includes(source));
  const reports: ImportReport[] = [];
  for (const entry of discovered.sources) {
    reports.push(
      await importSecondBrainSource({
        source: entry.source,
        from: entry.from,
        importsRoot: options.importsRoot,
        overwrite: options.overwrite,
        maxFiles: options.maxFiles,
        dryRun: options.dryRun,
      }),
    );
  }
  return { reports, foundSources, missingSources, unrecognized: discovered.unrecognized };
}

/** Lists imported sources with file counts, for `second-brain list`. */
export async function listSecondBrainSources(
  importsRoot: string,
): Promise<SourceCount[]> {
  const entries = await safeReadDir(importsRoot);
  const results: SourceCount[] = [];
  for (const entry of entries) {
    if (!isSecondBrainSourceId(entry)) {
      continue;
    }
    const dir = path.join(importsRoot, entry);
    const stat = await fs.stat(dir).catch(() => undefined);
    if (!stat?.isDirectory()) {
      continue;
    }
    let files = 0;
    let bytes = 0;
    for (const name of await safeReadDir(dir)) {
      if (isHtmlFileName(name) || isJsonFileName(name)) {
        continue;
      }
      if (!name.endsWith(".md")) {
        continue;
      }
      const fileStat = await fs.stat(path.join(dir, name)).catch(() => undefined);
      files += 1;
      bytes += fileStat?.size ?? 0;
    }
    results.push({ source: entry, files, bytes });
  }
  return results;
}
