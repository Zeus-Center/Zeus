# Quang Quy AI — Skills Directory

This directory contains reusable, domain-specific skills for the Hermes Agent project and Quang Quy AI platform.

## Available Skills

### hermes-project-analyst-code-manager

**Purpose**: Persistent project management and senior code analysis for Hermes until completion.

**When to use**:
- Diagnosing Hermes authentication/provider failures (e.g., HTTP 401 after provider switches)
- Planning minimal code/config fixes while preserving architecture
- Implementing and validating changes across GitHub Codespaces and Android/Termux
- Managing Git history, commits, and final repository push
- Root-cause analysis of runtime or integration issues
- Protecting API keys and secrets during all phases of development

**What it does**:
1. **Inspect** — baseline, git state, project docs
2. **Reproduce** — capture exact error, environment, stack trace
3. **Diagnose** — trace request path, inspect provider logic, analyze Git history
4. **Propose** — identify exact files, explain necessity, request approval for risky changes
5. **Implement** — smallest patch, preserve style, maintain architecture
6. **Validate** — run tests, verify configuration, check provider behavior
7. **Commit** — clean diff, descriptive message, logical separation
8. **Push** — final review, secret check, delivery to GitHub repository

**Key responsibilities**:
- Never expose, print, or commit secrets
- Never delete files without explicit approval
- Never refactor unrelated code
- Preserve `quangquy-ai` architecture and conventions
- Make minimal, targeted changes only
- Run tests before every commit
- Review full git diff before commit
- Keep each logical fix isolated
- Do not declare success without verification
- Prepare clean final commits for GitHub push

**Safety rules**:
- No real secrets in `.env`, source code, docs, or logs
- Use GitHub Actions/Codespaces secrets or runtime env vars
- Presence checks only, never value dumps
- Redact secrets before displaying logs
- Use Git history to compare configs, never search for plaintext secrets

**Target workflow**:
```
GitHub Codespaces -> diagnose/fix -> validate -> Android/Termux compatibility
```

**Example prompts** (use when you need to invoke this skill):

```
Use the hermes-project-analyst-code-manager skill to diagnose why Hermes returns
HTTP 401 after switching from Gemini to OpenRouter.
```

```
Use the hermes-project-analyst-code-manager skill to implement a fix for OpenRouter
credential resolution, validate it on both Codespaces and Android/Termux, and prepare
the final commit for push to quangquy-ai.
```

### second-brain

**Purpose**: Capture, organize, and recall everything exchanged with ChatGPT,
Claude.ai, Gemini, OpenClaw, and Hermes in one searchable memory.

**When to use**:
- Importing a chat export (`conversations.json`, Claude export folder, Gemini Takeout).
- Recalling "something we talked about before" with another AI.
- Handing shared memory (`USER.md`/`MEMORY.md`) to another AI so it continues a thread.
- Routing work to the right AI (ChatGPT: strategy, Claude: code, Gemini: research).

**What it does**:
1. Ingest exports → `memory/imports/<source>/*.md` (idempotent, secrets redacted).
2. Recall via `memory search` / `memory_get`.
3. Promote durable facts to `MEMORY.md` only with operator confirmation.
4. Enforce the shared-memory round-trip contract with external AIs.

**Commands**:
```bash
openclaw second-brain import chatgpt  --from ~/Downloads/conversations.json
openclaw second-brain import claude-ai --from ~/Downloads/claude-export/
openclaw second-brain import gemini   --from ~/Downloads/Takeout/Gemini/
openclaw second-brain list
# Hoặc không cần build OpenClaw:
node scripts/second-brain-import.mjs import chatgpt --from ~/Downloads/conversations.json
```

**Safety rules**:
- Redact secrets before writing; never commit exports or secrets to Git.
- Imported history is read-only archive; never auto-promotes into `MEMORY.md`.
- Ask before `--overwrite` or deleting imported notes.

Full guide: [docs/second-brain.md](../docs/second-brain.md)

---

## Skill Development Guidelines

Each skill should:
- Have a clear, single responsibility (not a general-purpose solver)
- Include a workflow with distinct phases
- Specify when/when-not to use it
- Provide safety guardrails and stop conditions
- Define what "done" means
- Support validation and reproducibility

Refer to the [Agent Customization](../.github/prompts/skills/agent-customization/SKILL.md) skill and the VS Code agent customization documentation for patterns and best practices.
