import assert from "node:assert/strict";
import { test } from "node:test";
import { extractGeminiHtml, normalizeGeminiJson } from "../src/normalize/gemini.ts";

test("gemini: normalizes JSON conversations", () => {
  const input = [
    {
      conversation_id: "g-1",
      title: "Ideas",
      create_time: "2024-06-01T00:00:00Z",
      messages: [
        { role: "user", content: "hello" },
        { role: "model", content: "world" },
      ],
    },
  ];
  const result = normalizeGeminiJson(input);
  assert.equal(result.conversations.length, 1);
  const record = result.conversations[0];
  assert.equal(record?.source, "gemini");
  assert.equal(record?.id, "g-1");
  assert.equal(record?.title, "Ideas");
  assert.deepEqual(
    record?.messages.map((message) => [message.role, message.text]),
    [
      ["user", "hello"],
      ["assistant", "world"],
    ],
  );
});

test("gemini: reads parts arrays (Gemini API style)", () => {
  const input = [
    {
      id: "g-2",
      messages: [{ author: "model", parts: [{ text: "part one" }, { text: "part two" }] }],
    },
  ];
  const result = normalizeGeminiJson(input);
  assert.equal(result.conversations[0]?.messages[0]?.text, "part one\npart two");
});

test("gemini: extracts legacy Takeout HTML", () => {
  const html = [
    "<html><head><title>My Gemini chat</title></head><body>",
    '<div class="conversation-container">',
    '<div class="query-text">What is 2+2?</div>',
    '<div class="model-response-text">It is <b>4</b>.</div>',
    '<div class="query-text">Thanks</div>',
    "</div></body></html>",
  ].join("\n");
  const record = extractGeminiHtml(html, "Chat-abc.html");
  assert.ok(record);
  assert.equal(record.title, "My Gemini chat");
  assert.deepEqual(
    record.messages.map((message) => [message.role, message.text]),
    [
      ["user", "What is 2+2?"],
      ["assistant", "It is 4."],
      ["user", "Thanks"],
    ],
  );
});

test("gemini: returns undefined for empty HTML", () => {
  assert.equal(extractGeminiHtml("<html><body></body></html>", "x"), undefined);
});
