#!/usr/bin/env bash
set -euo pipefail

# Cập nhật subtree core/ (OpenClaw) trong repo Zeus.
# Dùng: bash scripts/update-openclaw-subtree.sh [ref]
#   ref mặc định: main
#   Đổi nguồn: OPENCLAW_SOURCE_REPO=https://github.com/openclaw/openclaw.git

SOURCE_REPO="${OPENCLAW_SOURCE_REPO:-https://github.com/Zeus-Center/openclaw.git}"
SOURCE_REF="${1:-${OPENCLAW_SOURCE_REF:-main}}"
TARGET_DIR="core"
MARKER="$TARGET_DIR/.zeus-upstream.json"

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree must be clean before updating the OpenClaw subtree." >&2
  exit 1
fi

BRANCH="$(git branch --show-current)"
if [ -z "$BRANCH" ] || [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  echo "Run this script on a dedicated integration branch, not ${BRANCH:-detached HEAD}." >&2
  exit 1
fi

if [ ! -d "$TARGET_DIR" ] || [ ! -f "$MARKER" ]; then
  echo "OpenClaw subtree or upstream marker ($MARKER) is missing." >&2
  exit 1
fi

CURRENT_SHA="$(sed -n 's/.*"commit"[[:space:]]*:[[:space:]]*"\([0-9a-f]\{40\}\)".*/\1/p' "$MARKER" | head -n 1)"

git fetch --no-tags "$SOURCE_REPO" "$SOURCE_REF"
SOURCE_SHA="$(git rev-parse FETCH_HEAD)"

if [ "$SOURCE_SHA" = "$CURRENT_SHA" ]; then
  echo "OpenClaw subtree is already at $SOURCE_SHA"
  exit 0
fi

echo "Updating core/ from $CURRENT_SHA -> $SOURCE_SHA ($SOURCE_REPO $SOURCE_REF)"
echo "NOTE: core/extensions/second-brain is local work; re-apply it if the pull removes it."

git subtree pull \
  --prefix="$TARGET_DIR" \
  "$SOURCE_REPO" "$SOURCE_REF" \
  --squash \
  -m "chore(core): update OpenClaw subtree to ${SOURCE_SHA:0:12}"

if [ ! -d "$TARGET_DIR/extensions/second-brain" ]; then
  echo "WARNING: core/extensions/second-brain is missing after the pull." >&2
  echo "Restore it with: git checkout HEAD~1 -- core/extensions/second-brain" >&2
fi

TMP_MARKER="$(mktemp)"
sed "s|\"commit\": \"[0-9a-f]\{40\}\"|\"commit\": \"$SOURCE_SHA\"|; s|\"commit_date\": \"[0-9-]*\"|\"commit_date\": \"$(date -u +%F)\"|" "$MARKER" > "$TMP_MARKER"
mv "$TMP_MARKER" "$MARKER"
git add "$MARKER"
if ! git diff --cached --quiet; then
  git commit -m "chore(core): record OpenClaw source revision ${SOURCE_SHA:0:12}"
fi

echo "OpenClaw subtree updated to $SOURCE_SHA"
echo "Review the diff, run tests/build, then open a pull request."
