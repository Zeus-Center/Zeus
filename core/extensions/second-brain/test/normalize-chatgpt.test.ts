import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeChatGpt } from "../src/normalize/chatgpt.ts";

test("chatgpt: reconstructs main thread from current_node", () => {
  const input = [
    {
      title: "Plan the website",
      conversation_id: "conv-123",
      create_time: 1710000000,
      update_time: 1710000100,
      current_node: "node-3",
      mapping: {
        "node-1": {
          id: "node-1",
          parent: null,
          children: ["node-2"],
          message: {
            id: "msg-1",
            author: { role: "user" },
            create_time: 1710000000,
            content: { content_type: "text", parts: ["Hello!"] },
          },
        },
        "node-2": {
          id: "node-2",
          parent: "node-1",
          children: ["node-3"],
          message: {
            id: "msg-2",
            author: { role: "assistant" },
            create_time: 1710000030,
            content: { content_type: "text", parts: ["Hi there!"] },
          },
        },
        "node-3": {
          id: "node-3",
          parent: "node-2",
          children: [],
          message: {
            id: "msg-3",
            author: { role: "user" },
            create_time: 1710000060,
            content: { content_type: "text", parts: ["Let's start."] },
          },
        },
      },
    },
  ];

  const result = normalizeChatGpt(input);
  assert.equal(result.conversations.length, 1);
  const record = result.conversations[0];
  assert.equal(record?.source, "chatgpt");
  assert.equal(record?.id, "conv-123");
  assert.equal(record?.title, "Plan the website");
  assert.deepEqual(
    record?.messages.map((message) => [message.role, message.text]),
    [
      ["user", "Hello!"],
      ["assistant", "Hi there!"],
      ["user", "Let's start."],
    ],
  );
});

test("chatgpt: falls back to time-ordered messages without current_node", () => {
  const input = [
    {
      mapping: {
        a: { message: { id: "1", author: { role: "user" }, create_time: 200, content: { parts: ["second"] } } },
        b: { message: { id: "2", author: { role: "assistant" }, create_time: 100, content: { parts: ["first"] } } },
      },
    },
  ];
  const result = normalizeChatGpt(input);
  const record = result.conversations[0];
  assert.equal(record?.messages.length, 2);
  assert.equal(record?.messages[0]?.text, "first");
  assert.equal(record?.messages[1]?.text, "second");
});

test("chatgpt: tolerates legacy string content and object parts", () => {
  const input = [
    {
      mapping: {
        a: { message: { id: "1", author: { role: "user" }, content: "legacy text" } },
        b: {
          message: {
            id: "2",
            author: { role: "assistant" },
            content: { parts: [{ content_type: "text", text: "new text" }] },
          },
        },
      },
    },
  ];
  const result = normalizeChatGpt(input);
  const record = result.conversations[0];
  assert.deepEqual(
    record?.messages.map((message) => message.text),
    ["legacy text", "new text"],
  );
});

test("chatgpt: tolerates a { conversations: [...] } wrapper", () => {
  const result = normalizeChatGpt({
    conversations: [
      {
        title: "Wrapped",
        mapping: {
          a: { message: { id: "1", author: { role: "user" }, content: { parts: ["hi"] } } },
        },
      },
    ],
  });
  assert.equal(result.conversations.length, 1);
});

test("chatgpt: reports unrecognized shape", () => {
  const result = normalizeChatGpt({ nope: true });
  assert.equal(result.conversations.length, 0);
  assert.ok(result.warnings.length > 0);
});
