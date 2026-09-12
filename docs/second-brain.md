# Bộ nhớ thứ hai (Second Brain) — Quang Quý AI

Cập nhật: 2026-09-05

## 1. Mục tiêu

Gom **tất cả thông tin đã trao đổi trên mạng** với các AI (ChatGPT, Claude.ai,
Gemini, OpenClaw, Hermes) về **một kho ký ức duy nhất, tìm kiếm được**, không AI
nào "quên" những gì đã bàn trước đó.

Thiết kế theo triết lý "mở rộng ở edge" trong `AGENTS.md`: không tạo cơ sở dữ
liệu riêng, mà tận dụng hệ memory sẵn có của OpenClaw (file Markdown + index
SQLite + `memory search`/`memory_get`).

## 2. Kiến trúc

```text
ChatGPT export (conversations.json)
Claude.ai export (conversations.json)  ──┐
Gemini Takeout (JSON / Chat-*.html)   ──┤
Hermes MEMORY.md/USER.md (có sẵn)     ──┤
Codex / Claude Code (có sẵn)          ──┘
        │
        ▼  second-brain import (plugin + script standalone)
memory/imports/chatgpt|claude-ai|gemini/*.md   ← ghi vào index, KHÔNG trộn vào MEMORY.md
        │
        ▼
OpenClaw memory index (SQLite + semantic search)
        │
        ▼
memory search / memory get  →  ChatGPT · Claude · OpenClaw · Hermes · Gemini
```

Ba tầng dữ liệu:

| Tầng | Nơi lưu | Vai trò |
| --- | --- | --- |
| Lõi được chọn lọc | `MEMORY.md`, `USER.md` | Sự thật bền vững, nạp mỗi phiên |
| Lưu trữ tình tiết | `memory/imports/<nguồn>/*.md` | Lịch sử chat nhập về, tìm theo yêu cầu |
| Ghi chú hằng ngày | `memory/YYYY-MM-DD.md` | Quan sát đang diễn ra |

Lịch sử nhập về là **kho lưu trữ chỉ đọc**: tìm kiếm được, nhưng **không tự động
trộn vào** `MEMORY.md` bootstrap. Khi một sự thật bền vững lặp lại nhiều nguồn,
đưa nó vào `MEMORY.md` một cách có chủ đích (xem mục 6).

## 3. Cách dùng

### 3.1. Lấy file xuất từ từng AI

| Nguồn | Đường lấy |
| --- | --- |
| ChatGPT | Settings → Data controls → **Export data** → file `conversations.json` |
| Claude.ai | Settings → Data controls / **Export** → `conversations.json` (dạng zip, giải nén trước) |
| Gemini | **Google Takeout** → chọn Gemini → tải về → thư mục `Gemini/` (JSON `conversations.json` ưu tiên; hỗ trợ cả `Chat-*.html` cũ) |

### 3.2. Nhập qua plugin OpenClaw

```bash
openclaw second-brain import chatgpt  --from ~/Downloads/conversations.json
openclaw second-brain import claude-ai --from ~/Downloads/claude-export/
openclaw second-brain import gemini   --from ~/Downloads/Takeout/Gemini/
openclaw second-brain import chatgpt  --from ... --dry-run   # xem trước
openclaw second-brain list
```

### 3.3. Nhập bằng script standalone (không cần build OpenClaw)

Chạy được ngay trên Termux/Colab bằng Node ≥ 22.18:

```bash
node scripts/second-brain-import.mjs import chatgpt --from ~/Downloads/conversations.json
node scripts/second-brain-import.mjs import claude-ai --from ~/Downloads/claude-export/
node scripts/second-brain-import.mjs import gemini --from ~/Downloads/Takeout/Gemini/
node scripts/second-brain-import.mjs list
```

Mặc định ghi vào `~/.openclaw/workspace/memory/imports`; đổi bằng `--out <thư mục>`.

### 3.4. Tìm kiếm

```bash
openclaw memory search "website AI automation"
```

Trong chat: dùng tool `memory_search` / `memory_get`; khi trích lại luôn nêu nguồn
(`chatgpt`, `claude-ai`, `gemini`).

## 4. Kết nối với các AI khác (hợp đồng bộ nhớ dùng chung)

ChatGPT, Claude, Gemini không chạy được OpenClaw trực tiếp, nên tham gia qua
Markdown dùng chung:

- **Giao việc cho AI khác**: đưa `USER.md` + `MEMORY.md` + trích đoạn
  `memory/imports/<nguồn>/*.md` liên quan làm ngữ cảnh.
- **Đưa trở lại**: nhờ AI kia tóm tắt quyết định, rồi xuất lịch sử của nó và chạy
  `second-brain import`.
- `USER.md`/`MEMORY.md` là **nguồn duy nhất đúng**; các AI khác chỉ đọc bản sao.

### Điều phối đa model (routing)

Theo vai trò đã định trong `AGENTS.md`, OpenClaw/Hermes làm điều phối:

| AI | Vai trò |
| --- | --- |
| OpenClaw / Hermes | Điều phối, sở hữu bộ nhớ (import, tìm, tổng hợp) |
| ChatGPT | Chiến lược, kế hoạch, phối hợp |
| Claude | Code, refactor, kiến trúc |
| Gemini | Nghiên cứu, media, Colab/Python |

Việc nào đưa AI nào theo loại công việc và độ khó; **kết quả luôn ghi về bộ nhớ
chung** để AI kế tiếp bắt đầu từ ký ức, không phải từ số không.

## 5. Bảo mật

- Bộ import **tự động redact** secret thường gặp (API key `sk-…`, token
  `ghp_…`/`xox…`, JWT, `password=…`) thành `[redacted]` trước khi ghi; số lượng
  redaction được báo trong report.
- Không commit file xuất hoặc nội dung nhập chứa secret lên GitHub.
- File nhập nằm trong workspace của agent (`HERMES_HOME`/`~/.openclaw`), không nằm
  trong repository.
- Nhập là idempotent; `--overwrite` chỉ khi thực sự cần (ghi đè file hiện có).

## 6. Tổng hợp từ tình tiết lên lõi

Khi một sự thật bền vững lặp lại nhiều nguồn:

1. Viết nháp sự thật dưới dạng chỉ thị ngắn.
2. Xác nhận với Quang Quý (nội dung nhập có provenance bên ngoài).
3. Ghi vào `MEMORY.md` (hoặc `USER.md` cho sở thích cá nhân), supersede tại chỗ
   thay vì ghi thêm dòng mâu thuẫn.

## 7. Tình trạng & bước tiếp theo

- [x] Importer ChatGPT / Claude.ai / Gemini (plugin + script standalone).
- [x] Bộ test normalizer + import (Node test runner).
- [ ] Tích hợp nút "Import Memory" trong Control UI cho các nguồn web (hiện UI hỗ
  trợ Codex/Claude Code/Hermes qua `openclaw migrate`).
- [ ] Tự động tải export định kỳ (Google Takeout scheduled export / ChatGPT
  scheduled export) và import vào cron.
- [ ] Cấu hình routing đa model thành file policy để Hermes điều phối tự động.
- [ ] Đồng bộ kho `memory/imports` lên Drive (bản sao, mã hoá) khi cần đa thiết bị.

Xem thêm: [SKILL](/skills/second-brain/SKILL.md), kiến trúc memory trong
`core/docs/concepts/memory-architecture.md`.
