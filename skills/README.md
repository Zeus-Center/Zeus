# Quang Quy AI / Zeus — Skills Directory

This directory contains reusable, domain-specific skills for the Zeus / Hermes Agent platform.

## Available Skills

### 1. qai-developer-manager

**Purpose**: Principal engineering manager and senior developer for complex software-engineering tasks.

**When to use**:
- Repository-level debugging and multi-file code modifications
- Fixing provider, auth, or model-routing failures
- Android / Termux / Colab environment validation
- Ensuring test coverage, CI verification, and safe rollback mechanisms

**Key responsibilities**:
- Evidence before edits: reproduce or isolate issues first
- Smallest reversible patches
- Zero secret exposure
- Full test and validation verification before declaring done

Full guide: [skills/qai-developer-manager/SKILL.md](qai-developer-manager/SKILL.md)

---

### 2. hermes-project-analyst-code-manager

**Purpose**: Persistent project management and code analysis for the Hermes Agent runtime.

**When to use**:
- Diagnosing Hermes provider/auth switching issues
- Planning minimal code/config fixes while preserving architecture
- Implementing and validating changes across environments
- Managing Git history, clean commits, and GitHub repository synchronizations

Full guide: [skills/hermes-project-analyst-code-manager/SKILL.md](hermes-project-analyst-code-manager/SKILL.md)

---

### 3. second-brain

**Purpose**: Capture, organize, and recall everything exchanged with ChatGPT, Claude.ai, Gemini, and Hermes into one searchable memory.

**When to use**:
- Ingesting chat exports (`conversations.json`, Claude zip export, Gemini Takeout).
- Recalling past discussions across AI assistants.
- Handing shared memory (`USER.md` / `MEMORY.md`) to external AIs so they continue threads seamlessly.
- Multi-model routing (ChatGPT: strategy, Claude: code, Gemini: research).

**Commands**:
```bash
# Standalone importer (Node.js >= 22)
node scripts/second-brain-import.mjs import chatgpt --from ~/Downloads/conversations.json
node scripts/second-brain-import.mjs import claude-ai --from ~/Downloads/claude-export/
node scripts/second-brain-import.mjs import gemini --from ~/Downloads/Takeout/Gemini/
node scripts/second-brain-import.mjs ingest --from ~/Downloads/ai-inbox/
node scripts/second-brain-import.mjs list
```

Full guide: [docs/second-brain.md](../docs/second-brain.md) & [skills/second-brain/SKILL.md](second-brain/SKILL.md)

---

## Skill Development Guidelines

Each skill should:
- Have a clear, single responsibility
- Include distinct workflow phases
- Specify when and when-not to use it
- Provide safety guardrails and stop conditions
- Define what "done" means
- Support validation and reproducibility
