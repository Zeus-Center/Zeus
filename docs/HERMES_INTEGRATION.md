# Hermes integration in Zeus

Hermes is vendored under `agents/hermes/` as the orchestration runtime for Zeus (`Zeus-Center/Zeus`, the single repository).

## Source

- History-preserving subtree source: `NousResearch/hermes-agent`, branch `main`
  (the old technical fork `qquy28888-ops/hermes-agent` no longer exists — HTTP 404)
- Exact integrated revision: `agents/hermes/.quang-quy-source-commit` (pinned at `5e51b123f32b7f6a51fbd5759e89ba5146ce4003`)
- The source commit and its ancestry are reachable from the Quang Quy AI history.
- The original Hermes license and attribution files remain inside `agents/hermes/`.

## Security rules

- Never commit `.env`, API keys, OAuth tokens, cookies, private keys, or service-account JSON.
- Runtime secrets must be stored in VPS environment variables, GitHub Actions Secrets, or an approved secret manager.
- `.env.example` may contain variable names and placeholders only.
- Rotate any credential that was ever committed, even if it was later deleted.

## Deployment model

Production target: VPS Ubuntu + Hermes Gateway + Telegram. GitHub stores code and CI/CD; it does not host the always-on Hermes process.

## Updating Hermes

Run `scripts/update-hermes-subtree.sh` from a clean integration branch, review the history-preserving subtree commits, run tests, and open a pull request. Do not update `main` or production directly from the source repository.
