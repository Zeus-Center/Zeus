# Zeus — một kho duy nhất

> **Tên repo: `Zeus` (`Zeus-Center/Zeus`).** Đây là kho duy nhất của dự án.
> Mọi repo cũ (`ZeusopenAI/ZEUS`, `ZeusopenAI/chat`, `Zeus-Center/openclaw`) đã được gom vào đây.
> Bản đồ chi tiết, nguồn gốc từng phần và lệnh đồng bộ: [docs/REPOSITORY-CONSOLIDATION.md](docs/REPOSITORY-CONSOLIDATION.md).

Sản phẩm: **Quang Quý AI / Zeus** — hệ thống AI Automation và AI Manager cá nhân, vận hành được từ điện thoại (Termux), Google Colab và GitHub.

## Mục tiêu

- Một website/dịch vụ giới thiệu AI Automation và Marketing.
- Một AI Manager (Hermes) điều phối model, kênh và workflow.
- Quản lý mã nguồn bằng GitHub, triển khai chi phí thấp, có lịch sử và khôi phục được.
- **Không bị lộn repo:** chỉ có `Zeus`. Các thành phần bên ngoài được gom bằng subtree có ghi nguồn.

## Cấu trúc

```text
Zeus/
  core/                  # OpenClaw engine — subtree từ Zeus-Center/openclaw (fork của openclaw/openclaw)
  agents/hermes/         # Hermes Agent — subtree từ NousResearch/hermes-agent (giữ lịch sử)
  worker/telegram-proxy/ # Cloudflare Worker proxy webhook Telegram
  skills/                # Skill nội bộ (second-brain, qai-developer-manager, ...)
  scripts/               # Script đồng bộ subtree, recover, import, verify
  colab/                 # Bootstrap chạy repo trên Google Colab
  docs/                  # Runbook, audit, kiến trúc, tích hợp
  archive/               # Nội dung lưu lại từ các repo cũ đã gom (ví dụ ZeusopenAI/chat)
  .github/workflows/     # CI
```

Quy tắc vị trí:

| Muốn sửa gì | Sửa ở đâu |
|---|---|
| Tài liệu, runbook, roadmap, status | Thư mục gốc và `docs/` |
| Skill/automation nội bộ | `skills/`, `scripts/` |
| Lõi gateway đa kênh (OpenClaw) | `core/` |
| AI Manager/runtime Hermes | `agents/hermes/` |
| Webhook Telegram | `worker/telegram-proxy/` |

## Cập nhật các phần gom từ repo ngoài

Luôn chạy trên nhánh riêng, không chạy trên `main`:

```bash
bash scripts/update-openclaw-subtree.sh   # kéo core/ từ Zeus-Center/openclaw
bash scripts/update-hermes-subtree.sh     # kéo agents/hermes/ từ NousResearch/hermes-agent
bash scripts/verify-consolidation.sh      # kiểm tra nhanh cấu trúc sau khi gom/đồng bộ
```

Mỗi lần cập nhật: chạy script → review diff → chạy test/build → mở pull request → mới merge.

## Quy tắc làm việc

1. Không đưa mật khẩu, cookie, access token, API key hoặc file `.env` lên GitHub.
2. Không chỉnh sửa trực tiếp bản đang chạy nếu chưa có bản sao lưu.
3. Mỗi thay đổi lớn thực hiện trên nhánh riêng hoặc pull request.
4. Trước khi triển khai phải kiểm tra build và liên kết.
5. Ghi rõ file đã thay đổi trong mỗi commit.
6. Không tạo repo mới cho dự án này; mở thư mục mới trong `Zeus`.

## Tài liệu vận hành

- [Bản đồ gom 4 kho → 1 kho Zeus](docs/REPOSITORY-CONSOLIDATION.md)
- [Status](Status.md) · [TODO](TODO.md) · [Roadmap](Roadmap.md) · [Architecture](Architecture.md) · [Deployment](Deployment.md)
- [Tích hợp Hermes](docs/HERMES_INTEGRATION.md) · [Bộ nhớ thứ hai](docs/second-brain.md) · [Secret management](docs/SecretManagement.md)
- [Audit 2026-08-06](docs/AUDIT_2026-08-06.md) · [Tiến trình 2026-09-05](docs/PROGRESS_REVIEW_2026-09-05.md)

## Trạng thái nhanh

Hermes Agent đã tích hợp tại `agents/hermes/`, chạy được trên Termux bằng virtualenv + tmux supervisor.
OpenClaw nằm tại `core/` dưới dạng subtree có ghi nguồn; extension `second-brain` do chính dự án viết nằm tại `core/extensions/second-brain/`.
Production VPS và các integration bên ngoài vẫn đang triển khai — xem [Status](Status.md).
