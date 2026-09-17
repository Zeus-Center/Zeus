# Roadmap — Zeus / Quang Quý AI

Cập nhật: 2026-09-17

## Định hướng

Zeus (ZeusopenAI) phát triển theo hướng **hệ thống trợ lý AI cá nhân tinh gọn, mạnh mẽ và tự động hóa cao**. Không sử dụng mô hình monorepo doanh nghiệp cồng kềnh; tối ưu hóa trải nghiệm điều khiển trên điện thoại di động và đám mây.

## Giai đoạn 1 — Tinh gọn & Nền tảng Cloud Actions (Hiện tại - Hoàn tất)

- Tinh gọn repository về `ZeusopenAI/ZEUS`, loại bỏ mã nguồn phụ trợ thừa.
- Workflow chạy Hermes qua OpenRouter trên GitHub Actions (`hermes-openrouter.yml`).
- Second Brain Standalone Importer độc lập, hỗ trợ nhập ChatGPT, Claude, Gemini.
- Cloudflare Worker Proxy cho Telegram Webhook (`worker/telegram-proxy/`).
- Khởi tạo script đồng bộ trực tiếp `scripts/sync-to-zeusopenai.sh`.

## Giai đoạn 2 — Hoàn thiện Kết nối Đa Kênh & Đa Model

- Triển khai Cloudflare Worker proxy lên Cloudflare và nối Webhook Telegram vào Hermes Gateway.
- Cấu hình Multi-Model Routing trên Hermes (OpenRouter / Gemini / Claude / OpenAI Codex).
- Tích hợp Second Brain vào bộ nhớ dài hạn của Hermes để truy vấn tức thì qua Telegram.
- Thiết lập quy trình tự động cập nhật Second Brain định kỳ.

## Giai đoạn 3 — GPU Colab & Media Automation

- Hoàn thiện luồng tạo ảnh/video chất lượng cao bằng ComfyUI trên Google Colab.
- Tự động lưu trữ media tạo ra vào Google Drive cá nhân.
- Tích hợp công cụ tạo ảnh tự động qua Telegram bot và GitHub Actions runner.

## Giai đoạn 4 — AI Automation & Personal Brand

- Tự động hóa đăng bài, tạo nội dung marketing cho thương hiệu cá nhân **Nguyễn Quang Quý**.
- Tích hợp các kết nối SaaS bên ngoài (Notion, Google Workspace, Make/n8n) khi có nhu cầu cụ thể.
- Giám sát chi phí API và tối ưu hóa ngân sách vận hành.

## Chiến lược Repository

- **Kho chính (Canonical):** `ZeusopenAI/ZEUS`
- **Nguyên tắc:** Module hóa, không nhồi nhét framework thừa, mỗi thành phần đều có thể chạy độc lập (Node standalone, Python standalone, Cloudflare Worker, GitHub Actions).
