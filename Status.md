# Status — Quang Quý AI

Cập nhật: 2026-09-05

## Tổng quan

Trạng thái: development runtime hoạt động; chưa production-ready.

## Đã xác minh

- `hermes-agent 0.18.0` được cài editable từ `agents/hermes` vào `~/hermes-env`.
- Python 3.13.13; `pip check` báo không có dependency bị hỏng.
- `python -m hermes_cli.main --version` và `hermes --version` chạy thành công ngoài repository.
- Hermes chạy trong tmux bằng đúng virtualenv, model `gpt-5.6-sol`, provider `openai-codex`.
- Boot script và supervisor hợp lệ; duplicate boot script đã được đưa ra khỏi thư mục chạy.
- Cold-start thực tế thành công: session bị xóa, boot script tạo lại session và Hermes vào prompt.
- Python `compileall` thành công; có một `SyntaxWarning` trong test string tại `agents/hermes/tests/agent/test_credits_tracker.py:625`.
- Hermes đang ở mốc `1c671beab29164d8931c5d01c5739502267089d8` (2026-09-12), ghi trong `agents/hermes/.quang-quy-source-commit`; đã đồng bộ từ mốc cũ `5e51b12` (2026-07-07) vào 2026-09-13 bằng `scripts/update-hermes-subtree.sh`. Fork kỹ thuật cũ `qquy28888-ops/hermes-agent` đã không còn tồn tại (404); nguồn đồng bộ hiện tại là `NousResearch/hermes-agent`.
- High-confidence credential scan trên production paths hiện tại: 0 finding.
- `.hermes/auth.json` và `config.yaml` có mode 600; `~/.hermes` có mode 700.

## Bộ nhớ thứ hai (Second Brain)

- Đã thêm extension OpenClaw `second-brain` (tại `core/extensions/second-brain/`): nhập lịch sử ChatGPT (`conversations.json`), Claude.ai, Gemini (Takeout JSON/HTML) vào `memory/imports/<nguồn>/`, ghi vào index `memory search`; tự redact secret; idempotent.
- Script standalone `scripts/second-brain-import.mjs` chạy bằng Node ≥ 22.18 không cần build OpenClaw (phù hợp Termux/Colab); hỗ trợ `import`, `ingest` (gom cả 3 nguồn từ một thư mục inbox) và `list`.
- 20/20 test normalizer + import + ingest đạt (Node test runner).
- Skill `skills/second-brain/SKILL.md` và runbook `docs/second-brain.md` hoàn tất.
- Còn lại: tích hợp vào Control UI "Import Memory", tự động tải export định kỳ, policy điều phối đa model (xem `TODO.md`).

## Blocker

- Android package `com.termux.boot` chưa được cài; chưa thể chứng minh tự chạy sau reboot thật.
- `npm audit`: 12 vulnerabilities — 1 critical, 10 high, 1 low.
- Hermes test wrapper gặp `PermissionError` khi tạo subprocess test trên Android/Termux; cần CI Linux/VPS để xác nhận suite.
- GitHub CLI chưa đăng nhập; chưa kiểm tra/cấu hình branch protection và repository secrets qua authenticated API.
- Telegram, Claude, Gemini, Notion, Drive, Make và Hugging Face chưa được E2E test trong phiên audit này.
- Root CI chưa chạy full Hermes pytest, lint/typecheck, UI build hoặc OSV scan; workflow nằm trong `agents/hermes/.github/` không tự chạy ở repository cha.
- Fork `qquy28888-ops/hermes-agent` chậm hơn canonical upstream 6.045 commit tại thời điểm audit.

## Repository

- Canonical duy nhất: **`Zeus-Center/Zeus`**, branch `main`. Mọi repo cũ đã gom vào đây — xem [bản đồ gom repo](docs/REPOSITORY-CONSOLIDATION.md).
- Đã gom: `ZeusopenAI/ZEUS` (tên cũ `qquy28888-ops/quangquy-ai`, lịch sử nằm trọn trong Zeus), `ZeusopenAI/chat` (lưu tại `archive/zeusopenai-chat/`), `Zeus-Center/openclaw` (thành subtree `core/`), bản thân `Zeus-Center/Zeus`.
- Source history Hermes: `NousResearch/hermes-agent`, branch `main`; subtree không squash tại `agents/hermes/`, SHA ghi trong `agents/hermes/.quang-quy-source-commit`.
- Source OpenClaw: `Zeus-Center/openclaw` (fork mirror của `openclaw/openclaw`), subtree tại `core/`, nguồn ghi trong `core/.zeus-upstream.json`.
- Migration branch đã bảo toàn ancestry Hermes và thay updater snapshot bằng subtree updater; đã hoàn tất.

## Mức sẵn sàng

| Khu vực | Trạng thái |
|---|---|
| Hermes CLI/TUI | Đạt cho development |
| tmux supervisor | Đạt cold-start |
| Android reboot | Blocked: thiếu Termux:Boot |
| Python dependencies | Đạt `pip check` |
| Python syntax | Đạt, 1 warning test |
| Node security | Không đạt: critical/high advisories |
| Secrets trong source hiện tại | Không thấy high-confidence finding |
| CI production | Chưa đủ full test/build |
| VPS deployment | Chưa triển khai |
