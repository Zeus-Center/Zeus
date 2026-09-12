import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import {
  discoverInboxSources,
  ingestSecondBrainInbox,
} from "../src/import-conversations.ts";

async function makeTempDir(): Promise<string> {
  return await fs.mkdtemp(path.join(os.tmpdir(), "second-brain-inbox-"));
}

const chatGptExport = [
  {
    title: "One",
    conversation_id: "c1",
    current_node: "b",
    mapping: {
      a: { parent: null, children: ["b"], message: { id: "m1", author: { role: "user" }, content: { parts: ["hi"] } } },
      b: { parent: "a", children: [], message: { id: "m2", author: { role: "assistant" }, content: { parts: ["hello"] } } },
    },
  },
];

const claudeExport = [
  {
    uuid: "u1",
    name: "Two",
    chat_messages: [
      { sender: "human", text: "ping" },
      { sender: "assistant", text: "pong" },
    ],
  },
];

const geminiExport = [
  {
    conversation_id: "g1",
    title: "Three",
    messages: [{ role: "user", content: "q" }, { role: "model", content: "a" }],
  },
];

test("ingest: discovers named files and folders in an inbox", async () => {
  const dir = await makeTempDir();
  await fs.mkdir(path.join(dir, "claude"), { recursive: true });
  await fs.writeFile(path.join(dir, "chatgpt.json"), JSON.stringify(chatGptExport), "utf8");
  await fs.writeFile(path.join(dir, "claude", "conversations.json"), JSON.stringify(claudeExport), "utf8");
  await fs.writeFile(path.join(dir, "gemini.json"), JSON.stringify(geminiExport), "utf8");
  await fs.writeFile(path.join(dir, "random.json"), "{}", "utf8");

  const discovery = await discoverInboxSources(dir);
  const sources = discovery.sources.map((entry) => entry.source).toSorted();
  assert.deepEqual(sources, ["chatgpt", "claude-ai", "gemini"]);
  assert.ok(discovery.unrecognized.includes("random.json"));

  await fs.rm(dir, { recursive: true, force: true });
});

test("ingest: imports all recognized sources in one pass", async () => {
  const dir = await makeTempDir();
  const importsRoot = path.join(dir, "memory", "imports");
  await fs.writeFile(path.join(dir, "chatgpt.json"), JSON.stringify(chatGptExport), "utf8");
  await fs.writeFile(path.join(dir, "claude-ai.json"), JSON.stringify(claudeExport), "utf8");
  await fs.writeFile(path.join(dir, "gemini.json"), JSON.stringify(geminiExport), "utf8");

  const report = await ingestSecondBrainInbox({ inboxDir: dir, importsRoot });
  assert.deepEqual(report.foundSources.toSorted(), ["chatgpt", "claude-ai", "gemini"]);
  assert.deepEqual(report.missingSources, []);
  assert.equal(report.reports.length, 3);
  assert.ok(report.reports.every((entry) => entry.created === 1));

  await fs.rm(dir, { recursive: true, force: true });
});

test("ingest: reports missing sources", async () => {
  const dir = await makeTempDir();
  await fs.writeFile(path.join(dir, "chatgpt.json"), JSON.stringify(chatGptExport), "utf8");
  const report = await ingestSecondBrainInbox({
    inboxDir: dir,
    importsRoot: path.join(dir, "out"),
  });
  assert.deepEqual(report.foundSources, ["chatgpt"]);
  assert.deepEqual(report.missingSources.toSorted(), ["claude-ai", "gemini"]);
  await fs.rm(dir, { recursive: true, force: true });
});
