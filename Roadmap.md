# Roadmap — Quang Quý AI

Cập nhật: 2026-08-06

## Định hướng

Hermes là AI Manager trung tâm: nhận yêu cầu, chọn model/công cụ, điều phối workflow, giữ trạng thái và trả kết quả qua Telegram/CLI. GitHub là nguồn mã chuẩn; Notion/Google Drive quản lý tri thức và tài liệu; Make xử lý automation SaaS; VPS là production runtime 24/7.

## Giai đoạn 0 — nền tảng Termux (hiện tại)

Mục tiêu: có runtime phát triển ổn định trên Android.

- Entrypoint, editable install và tmux supervisor: hoàn tất.
- Cold-start từ boot script: hoàn tất.
- Còn thiếu: cài Termux:Boot và reboot thật.
- Gate thoát giai đoạn: sau reboot có boot log mới, tmux session tồn tại, process Hermes đúng venv và Telegram round-trip thành công.

## Giai đoạn 1 — bảo mật và CI

Mục tiêu: repository có thể phát triển an toàn.

- Sửa npm advisories theo từng dependency, không dùng `npm audit fix --force` trên `main`.
- Chạy Python/Node tests trong GitHub Actions Linux.
- Pin GitHub Actions bằng commit SHA.
- Bật branch protection, review và required status checks.
- Chuẩn hóa secret inventory, owner, scope, expiry và rotation.
- Đồng bộ technical fork `hermes-agent` với upstream chính thức trước khi nhận thêm thay đổi sản phẩm.

Gate: CI xanh, không có critical/high vulnerability chưa có quyết định xử lý, không có secret trong Git history hiện hành.

## Giai đoạn 2 — kênh và nhà cung cấp AI

Mục tiêu: Hermes điều phối được đa model và đa kênh.

Thứ tự triển khai:

1. Telegram Gateway.
2. OpenAI Codex hiện tại + Claude fallback.
3. Gemini fallback/vision.
4. GitHub workflow qua `gh`.
5. Notion và Google Drive.
6. Make webhook.
7. Hugging Face model/dataset operations.

Mỗi integration phải có least privilege, timeout, retry có giới hạn, idempotency và audit log.

## Giai đoạn 3 — VPS production

Mục tiêu: không phụ thuộc Android để chạy liên tục.

- VPS Ubuntu tối thiểu, firewall mặc định deny.
- Hermes Gateway chạy dưới service manager và user không phải root.
- Reverse proxy/TLS chỉ khi cần HTTP ingress.
- Backup encrypted ngoài máy, kiểm thử restore.
- Monitoring uptime, disk, memory, API errors và budget.

Gate: staging soak test, rollback đã diễn tập, Telegram và workflow quan trọng có health check.

## Giai đoạn 4 — AI Manager nâng cao

- Routing theo chi phí/độ khó/độ nhạy dữ liệu.
- Human approval cho deploy, gửi dữ liệu, phát sinh chi phí và thao tác phá hủy.
- Kanban nhiều agent cho workflow dài.
- Báo cáo định kỳ về tiến độ, chi phí và sự cố.
- Knowledge retrieval có phân quyền giữa cá nhân, dự án và khách hàng.

## Chiến lược repository

**Chỉ một repository: `Zeus-Center/Zeus`.** Đây là hệ quả của đợt gom 4 kho (2026-09-13); bản đồ chi tiết nằm ở [docs/REPOSITORY-CONSOLIDATION.md](docs/REPOSITORY-CONSOLIDATION.md).

Vai trò các thành phần:

- `Zeus-Center/Zeus`: repo duy nhất — tài liệu, automation, deployment, business logic, skill và CI.
- `agents/hermes/`: Hermes Agent, Git subtree không `--squash` từ `NousResearch/hermes-agent` (canonical upstream).
- `core/`: OpenClaw engine, subtree từ `Zeus-Center/openclaw` (mirror của `openclaw/openclaw`), có marker `core/.zeus-upstream.json`.

Quy tắc: không tiếp tục copy snapshot vì cách đó mất ancestry và contributor attribution; không tạo repo mới cho dự án này. Migration phải có backup tag, tree-equivalence check và rollback; mọi cập nhật tiếp theo chạy trên integration branch qua `scripts/update-hermes-subtree.sh` và `scripts/update-openclaw-subtree.sh`. Fork kỹ thuật cũ `qquy28888-ops/hermes-agent` đã không còn tồn tại.
