import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeClaudeAi } from "../src/normalize/claude-ai.ts";

test("claude-ai: normalizes chat_messages", () => {
  const input = [
    {
      uuid: "uuid-1",
      name: "Refactor notes",
      created_at: "2024-05-01T10:00:00Z",
      updated_at: "2024-05-01T10:05:00Z",
      chat_messages: [
        { uuid: "m1", sender: "human", text: "Help me refactor.", created_at: "2024-05-01T10:00:00Z" },
        { uuid: "m2", sender: "assistant", text: "Sure!", created_at: "2024-05-01T10:01:00Z" },
      ],
    },
  ];
  const result = normalizeClaudeAi(input);
  assert.equal(result.conversations.length, 1);
  const record = result.conversations[0];
  assert.equal(record?.source, "claude-ai");
  assert.equal(record?.id, "uuid-1");
  assert.equal(record?.title, "Refactor notes");
  assert.deepEqual(
    record?.messages.map((message) => [message.role, message.text]),
    [
      ["user", "Help me refactor."],
      ["assistant", "Sure!"],
    ],
  );
});

test("claude-ai: extracts text from content blocks", () => {
  const input = [
    {
      uuid: "uuid-2",
      chat_messages: [
        {
          sender: "assistant",
          content: [
            { type: "text", text: "block one" },
            { type: "thinking", text: "hidden" },
          ],
        },
      ],
    },
  ];
  const result = normalizeClaudeAi(input);
  const record = result.conversations[0];
  assert.deepEqual(record?.messages.map((message) => message.text), ["block one\nhidden"]);
});

test("claude-ai: skips conversations without messages", () => {
  const result = normalizeClaudeAi([{ uuid: "empty", chat_messages: [] }]);
  assert.equal(result.conversations.length, 0);
});
