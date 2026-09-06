---
name: second-brain
description: Capture, organize, and recall everything the operator has exchanged with ChatGPT, Claude.ai, Gemini, OpenClaw, and Hermes. Use to import a chat export, search the unified memory, or hand shared memory to another AI so nothing is forgotten.
license: MIT-compatible synthesized workflow; do not copy third-party source verbatim.
---

# Second Brain

## Mission

Maintain a single, searchable, plain-file memory for everything the operator has
talked about or exchanged online across AIs (ChatGPT, Claude.ai, Gemini,
OpenClaw, Hermes). The second brain is **not** a new database: it lives inside the
OpenClaw memory index under `memory/imports/<source>/`, so `memory_search` and
`memory_get` can recall it on demand without bloating the bootstrap prompt.

## Mental model

| Layer            | Where                             | Purpose                                   |
| ---------------- | --------------------------------- | ----------------------------------------- |
| Curated core     | `MEMORY.md`, `USER.md`            | Durable facts, loaded every session       |
| Episodic archive | `memory/imports/<source>/*.md`    | Imported chat history, searchable on demand |
| Working notes    | `memory/YYYY-MM-DD.md`            | Daily observations                        |

Imported chat history is **read-only archive**: it is searchable but never
merged into `MEMORY.md` automatically. If a recurring, durable fact emerges from
an import, promote it deliberately (see "Promotion").

## When to use

- The operator says they talked about something "before" with ChatGPT / Claude /
  Gemini but nobody remembers the details.
- A new export file (`conversations.json`, a Claude export folder, or a Gemini
  Takeout folder) has arrived and should be ingested.
- Another AI (ChatGPT, Claude, Gemini) needs shared context so it can continue a
  thread without the operator re-explaining everything.

## How to capture (ingest)

### Via the OpenClaw plugin

```bash
openclaw second-brain import chatgpt  --from ~/Downloads/conversations.json
openclaw second-brain import claude-ai --from ~/Downloads/claude-export/
openclaw second-brain import gemini   --from ~/Downloads/Takeout/Gemini/
openclaw second-brain list
```

### Via the standalone script (no OpenClaw build needed)

```bash
node scripts/second-brain-import.mjs import chatgpt --from ~/Downloads/conversations.json
node scripts/second-brain-import.mjs list
```

### Where exports come from

- **ChatGPT**: Settings → Data controls → Export data → `conversations.json`.
- **Claude.ai**: Settings → Data controls / Export → `conversations.json` (a zip;
  extract first, point at the JSON or the folder).
- **Gemini**: Google Takeout → select **Gemini** → download → the `Gemini/` folder
  (JSON `conversations.json` preferred; legacy `Chat-*.html` also supported).

### Capture rules

1. Import is **idempotent**: re-running skips files already present unless
   `--overwrite` is passed.
2. Secrets in the source text are redacted (`[redacted]`) before writing; report
   the redaction count to the operator.
3. Never commit export files or the imported notes' raw secrets to Git. The
   imports live in the agent workspace, not the repository.
4. Use `--dry-run` first when the export is large or unfamiliar.

## How to recall

```bash
openclaw memory search "website AI automation" --agent <id>
openclaw memory get <path> --agent <id>
```

Inside a chat session, prefer the `memory_search` / `memory_get` tools. Cite the
source (`chatgpt`, `claude-ai`, or `gemini`) when quoting recalled material.

## Promotion (episodic → curated)

Imported history does not become `MEMORY.md` automatically. When a durable,
operator-verified fact recurs across sources:

1. Draft the fact as a short directive.
2. Confirm it with the operator (imported content is external provenance).
3. Append it to `MEMORY.md` (or `USER.md` for profile preferences), marking it
   superseded-in-place rather than duplicating.

## Sharing memory with the other AIs (round-trip contract)

ChatGPT, Claude, and Gemini cannot run OpenClaw directly, so they participate
through shared Markdown:

- **Hand-off to another AI**: give it the relevant `USER.md` + `MEMORY.md` +
  the matching `memory/imports/<source>/*.md` excerpt as context.
- **Bring it back**: ask the other AI to summarize decisions, then export its
  history and run the matching `second-brain import`.
- Keep the curated `USER.md`/`MEMORY.md` the **single source of truth**; the
  other AIs read a copy, never the canonical files.

## Routing policy (who does what)

Mirror the roles in `AGENTS.md` and let OpenClaw/Hermes route:

- **OpenClaw / Hermes** — orchestrator and memory owner; runs imports, search,
  and consolidation.
- **ChatGPT** — strategy, planning, coordination.
- **Claude** — code, refactor, architecture.
- **Gemini** — research, media, Colab/Python tasks.

Route by task type and difficulty; always write the outcome back to the second
brain so the next AI starts from memory, not from zero.

## Guardrails

- Never print or commit secrets; redact before displaying logs.
- Ask before deleting or overwriting imported notes (`--overwrite` rewrites files).
- Do not let external chat content auto-promote into `MEMORY.md`.
- Treat imported content as untrusted provenance until the operator confirms it.
