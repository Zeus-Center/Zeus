# Bản đồ gom 4 kho → 1 kho Zeus

Cập nhật: 2026-09-13 · Thực hiện trên nhánh `arena/01a096b0-zeus`

Tài liệu này là nguồn duy nhất trả lời câu hỏi: **"Cái này trước nằm ở repo nào, giờ nằm ở đâu trong Zeus?"**

## 1. Tóm tắt

| # | Repo cũ | Tình trạng trước khi gom | Vị trí trong `Zeus` | Cách gom |
|---|---|---|---|---|
| 1 | [`ZeusopenAI/ZEUS`](https://github.com/ZeusopenAI/ZEUS) (tên cũ `qquy28888-ops/quangquy-ai`) | product/control-plane gốc · 14.835 commit · ~320 MB · push cuối 2026-08-14 | Thư mục gốc + `agents/`, `skills/`, `scripts/`, `docs/`, `colab/` | Đã nằm trọn trong lịch sử `Zeus` — tip `0649422` là tổ tiên của `Zeus@main` (đã kiểm chứng bằng `git merge-base --is-ancestor`) |
| 2 | [`ZeusopenAI/chat`](https://github.com/ZeusopenAI/chat) | 1 commit, 1 file `message.txt` (141 byte) — ghi chú gửi từ điện thoại | `archive/zeusopenai-chat/message.txt` | Sao lưu nguyên nội dung vào `archive/` |
| 3 | [`Zeus-Center/openclaw`](https://github.com/Zeus-Center/openclaw) | fork của `openclaw/openclaw` · 82.584 commit · ~2,8 GB · **không có commit riêng** (chỉ là mirror) | `core/` | Chuyển từ bản copy rời thành **subtree có theo dõi nguồn** tại `4a846f1d` |
| 4 | [`Zeus-Center/Zeus`](https://github.com/Zeus-Center/Zeus) | repo đích · 14.854 commit · ~426 MB | Giữ nguyên, là repo duy nhất | — |

Ngoài ra có hai repo **upstream bên ngoài** — không phải repo của dự án, không gom, chỉ đồng bộ:

| Upstream | Vai trò | Vị trí trong `Zeus` | Mốc hiện tại |
|---|---|---|---|
| [`NousResearch/hermes-agent`](https://github.com/NousResearch/hermes-agent) | nguồn của Hermes Agent | `agents/hermes/` (subtree giữ lịch sử) | đã đồng bộ tới `1c671be…` (2026-09-12) vào 2026-09-13; trước đó pin `5e51b12…` (2026-07-07) |
| [`openclaw/openclaw`](https://github.com/openclaw/openclaw) | nguồn gốc của `Zeus-Center/openclaw` | gián tiếp qua `core/` | `core/` đang ở `4a846f1d…` (2026-08-25) |

> Lưu ý: fork kỹ thuật cũ `qquy28888-ops/hermes-agent` **không còn tồn tại** (GitHub trả 404). Mọi script và workflow đã được đổi sang `NousResearch/hermes-agent`.

## 2. Chi tiết từng repo

### 2.1 `ZeusopenAI/ZEUS` (tên cũ `qquy28888-ops/quangquy-ai`)

- Tạo: 2026-07-02 · Push cuối: 2026-08-14 · ~320 MB · 14.835 commit · tip `0649422cfd74218efa04c458abf53dd4885fa675`.
- Chứa: tài liệu dự án (`AGENTS.md`, `Status.md`, `Roadmap.md`, `Architecture.md`, `Deployment.md`, `TODO.md`), `agents/hermes` (subtree Hermes), `skills/`, `scripts/`, `docs/`, `colab/`, `.github/`.
- **Trạng thái: đã gom.** Toàn bộ lịch sử của repo này nằm trong `Zeus`; `Zeus` chỉ hơn thêm các commit phát triển sau (PR #1, #2 và đợt gom này).
- Kiểm chứng: `git merge-base --is-ancestor 0649422 HEAD` → đúng.

### 2.2 `ZeusopenAI/chat`

- Tạo: 2026-08-19 · 1 commit `bed4779` ("Cap nhat tin nhan") · 1 file `message.txt` (141 byte).
- Nội dung đã được lưu tại `archive/zeusopenai-chat/message.txt`.
- **Trạng thái: đã gom (dạng lưu trữ).** Không còn lý do giữ repo riêng cho một file ghi chú.

### 2.3 `Zeus-Center/openclaw` → `core/`

- Tạo: 2026-08-26 · 82.584 commit · ~2,8 GB · fork của `openclaw/openclaw`.
- `pushed_at` trùng `created_at` → fork **chưa từng có commit riêng**, là mirror của upstream tại `4a846f1d614c76a200586d699ad091590efbb43a` (2026-08-25).
- Trước đây `core/` là bản copy rời (commit `ef51aa695 "Add OpenClaw core engine"`), không có thông tin nguồn, không đồng bộ được.
- Hiện tại: `core/` là **subtree** import từ chính fork đó, có commit squash ghi rõ nguồn và file marker `core/.zeus-upstream.json`.
- Extension `core/extensions/second-brain` (16 file, do dự án tự viết) đã được giữ lại nguyên vẹn sau khi import.
- **Vì sao squash thay vì giữ toàn bộ 82.584 commit:** fork không có commit riêng nên không có lịch sử riêng để mất; giữ full history sẽ làm repo `Zeus` phình lên ~2,8 GB và `git log` bị ngợp bởi lịch sử upstream — ngược với mục tiêu "một kho, không bị lộn". Toàn bộ lịch sử upstream vẫn truy cập được ở `openclaw/openclaw` và bằng lệnh dưới đây.
- Nếu sau này cần full history trong `Zeus`:

  ```bash
  # CẢNH BÁO: làm repo tăng ~2,8 GB. Chạy trên nhánh riêng.
  git rm -r core && git commit -m "chore: drop squashed core"
  git subtree add --prefix=core https://github.com/Zeus-Center/openclaw.git main
  ```

### 2.4 `Zeus-Center/Zeus`

- Repo đích duy nhất. Mọi tài liệu đã được cập nhật để trỏ về đây.

## 3. Đồng bộ sau này

| Phần | Lệnh | Ghi chú |
|---|---|---|
| `core/` (OpenClaw) | `bash scripts/update-openclaw-subtree.sh [ref]` | Mặc định lấy từ `Zeus-Center/openclaw@main`; đổi bằng `OPENCLAW_SOURCE_REPO=https://github.com/openclaw/openclaw.git` để lấy thẳng upstream |
| `agents/hermes/` (Hermes) | `bash scripts/update-hermes-subtree.sh [ref]` | Subtree giữ lịch sử từ `NousResearch/hermes-agent@main` |
| Kiểm tra toàn bộ | `bash scripts/verify-consolidation.sh` | Kiểm tra subtree, marker, đường dẫn cũ |

Quy trình bắt buộc: chạy script trên nhánh riêng → review diff → chạy test/build → PR → merge. Không cập nhật trực tiếp trên `main`/production.

## 4. Rollback

| Tình huống | Cách xử lý |
|---|---|
| Import `core/` sai | `git revert -m 1 <commit-import>` (commit merge của `git subtree add`) |
| Mất file do import | `git show <commit-cũ>:đường/dẫn/file` để lấy lại; commit cũ vẫn còn trong lịch sử |
| Repo cũ bị xóa nhầm | GitHub giữ deleted repo có thể khôi phục trong thời gian ngắn; vì vậy **khuyến nghị archive, không xóa** |

## 5. Việc cần làm tiếp (có chủ đích chưa thực hiện)

1. **Archive** (không xóa) 3 repo cũ: `ZeusopenAI/ZEUS`, `ZeusopenAI/chat`, `Zeus-Center/openclaw`. Chỉ làm khi bạn xác nhận.
2. Cập nhật nhánh mặc định/README của các repo cũ để trỏ về `Zeus-Center/Zeus` trước khi archive.
3. Chạy full test suite Hermes trên Linux CI/VPS sau đợt đồng bộ 2026-09-13 (19.208 commit upstream, +19k commit lịch sử); chưa chạy được trên Termux do `PermissionError` ở subprocess test harness.
4. Sửa workflow `.github/workflows/integrate-hermes.yml`: workflow này sinh ra từ giai đoạn tích hợp Hermes, nay đã lỗi thời (tích hợp đã xong); nên thay bằng workflow đồng bộ subtree định kỳ.
