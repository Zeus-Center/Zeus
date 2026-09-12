#!/usr/bin/env bash
set -euo pipefail

# Kiểm tra nhanh cấu trúc kho Zeus sau khi gom 4 kho thành 1.
# Dùng: bash scripts/verify-consolidation.sh

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

fail=0
pass() { printf '  OK   %s\n' "$1"; }
bad()  { printf '  FAIL %s\n' "$1"; fail=1; }

echo "== Cấu trúc =="
[ -d core ] && pass "core/ (OpenClaw subtree)" || bad "thiếu core/"
[ -f core/.zeus-upstream.json ] && pass "marker core/.zeus-upstream.json" || bad "thiếu core/.zeus-upstream.json"
[ -d core/extensions/second-brain ] && pass "core/extensions/second-brain (code nội bộ được giữ)" || bad "mất core/extensions/second-brain"
[ -d agents/hermes ] && pass "agents/hermes/ (Hermes subtree)" || bad "thiếu agents/hermes/"
[ -f agents/hermes/.quang-quy-source-commit ] && pass "marker Hermes source commit" || bad "thiếu agents/hermes/.quang-quy-source-commit"
[ -d worker/telegram-proxy ] && pass "worker/telegram-proxy/" || bad "thiếu worker/telegram-proxy/"
[ -f docs/REPOSITORY-CONSOLIDATION.md ] && pass "bản đồ gom repo" || bad "thiếu docs/REPOSITORY-CONSOLIDATION.md"
[ -d archive/zeusopenai-chat ] && pass "archive/zeusopenai-chat/ (nội dung repo chat cũ)" || bad "thiếu archive/zeusopenai-chat/"

echo "== Lịch sử đã gom =="
if git rev-parse -q --verify 0649422cfd74218efa04c458abf53dd4885fa675 >/dev/null 2>&1; then
  git merge-base --is-ancestor 0649422cfd74218efa04c458abf53dd4885fa675 HEAD \
    && pass "lịch sử ZeusopenAI/ZEUS (tip 0649422) nằm trong Zeus" \
    || bad "0649422 có mặt nhưng không phải tổ tiên của HEAD"
else
  bad "không tìm thấy commit 0649422 (repo cũ ZeusopenAI/ZEUS)"
fi

HERMES_PIN="$(tr -d ' \r\n' < agents/hermes/.quang-quy-source-commit 2>/dev/null || true)"
if [ -n "$HERMES_PIN" ] && git cat-file -e "$HERMES_PIN" 2>/dev/null; then
  pass "mốc Hermes ${HERMES_PIN:0:12} (theo marker) nằm trong lịch sử"
else
  bad "marker agents/hermes/.quang-quy-source-commit trống hoặc trỏ về commit không có trong lịch sử"
fi

echo "== Tham chiếu lỗi thời =="
# Chỉ coi là lỗi khi còn URL trỏ tới repo cũ (fork hermes-agent đã 404, quangquy-ai đã đổi tên).
# Nhắc tên repo cũ trong tài liệu lịch sử thì được phép.
stale="$(grep -rIl -E "https://(github\.com|raw\.githubusercontent\.com)/qquy28888-ops/" \
  --exclude-dir=.git --exclude-dir=node_modules --exclude=verify-consolidation.sh . 2>/dev/null || true)"
if [ -n "$stale" ]; then
  bad "còn URL trỏ tới repo cũ qquy28888-ops/* (fork hermes-agent đã 404, quangquy-ai đã thành Zeus):"
  echo "$stale" | sed 's/^/       /'
else
  pass "không còn URL trỏ tới repo cũ qquy28888-ops/*"
fi

if grep -q "Zeus-Center/Zeus" README.md 2>/dev/null; then
  pass "README trỏ về repo duy nhất Zeus-Center/Zeus"
else
  bad "README chưa trỏ về Zeus-Center/Zeus"
fi

