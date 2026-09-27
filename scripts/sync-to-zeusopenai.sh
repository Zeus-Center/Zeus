#!/usr/bin/env bash
set -euo pipefail

# Script đồng bộ code từ kho Zeus sang ZeusopenAI/ZEUS
# Mục tiêu: Đẩy toàn bộ nội dung tinh gọn (Hermes, Actions, Skills, Docs, Worker, Scripts) sang repo chính ZeusopenAI/ZEUS

TARGET_REPO_URL="${ZEUS_TARGET_REPO:-https://github.com/ZeusopenAI/ZEUS.git}"
TARGET_BRANCH="${1:-main}"
REMOTE_NAME="zeusopenai"

echo "=== Đồng bộ nội dung sang $TARGET_REPO_URL (nhánh: $TARGET_BRANCH) ==="

# 1. Kiểm tra trạng thái git hiện tại
CURRENT_BRANCH="$(git branch --show-current 2>/dev/null || echo '')"
echo "Nhánh hiện tại: $CURRENT_BRANCH"

# 2. Thêm hoặc cập nhật remote
if git remote | grep -q "^$REMOTE_NAME$"; then
  echo "Remote '$REMOTE_NAME' đã tồn tại, cập nhật URL..."
  git remote set-url "$REMOTE_NAME" "$TARGET_REPO_URL"
else
  echo "Thêm remote '$REMOTE_NAME' -> $TARGET_REPO_URL"
  git remote add "$REMOTE_NAME" "$TARGET_REPO_URL"
fi

# 3. Hướng dẫn xác thực nếu đẩy trực tiếp
echo ""
echo "--- Hướng dẫn đẩy sang ZeusopenAI/ZEUS ---"
echo "Nếu bạn có Personal Access Token (PAT) của tài khoản ZeusopenAI, bạn có thể chạy:"
echo "  git push $REMOTE_NAME HEAD:$TARGET_BRANCH"
echo ""
echo "Hoặc cấu hình token trong URL:"
echo "  git remote set-url $REMOTE_NAME https://<TOKEN>@github.com/ZeusopenAI/ZEUS.git"
echo "  git push $REMOTE_NAME HEAD:$TARGET_BRANCH"
echo ""

if [ "${DRY_RUN:-0}" = "1" ]; then
  echo "[DRY-RUN] Kiểm tra push..."
  git push --dry-run "$REMOTE_NAME" "HEAD:$TARGET_BRANCH" || true
else
  echo "Bạn có muốn thực hiện đẩy ngay bây giờ không?"
  echo "Chạy lệnh: git push $REMOTE_NAME HEAD:$TARGET_BRANCH"
fi
