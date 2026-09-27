# Architecture — Zeus / Quang Quý AI

Cập nhật: 2026-09-17

## 1. Vai trò hệ thống

Zeus (ZeusopenAI) là hệ thống AI Automation cá nhân và điều phối tác vụ cho thương hiệu **Nguyễn Quang Quý**. Hệ thống sử dụng Hermes Agent làm bộ não điều phối, kết hợp với các dịch vụ đám mây (GitHub Actions, Cloudflare Workers, Google Colab, Google Drive) để vận hành mọi lúc mọi nơi từ điện thoại.

## 2. Kiến trúc logic

```text
Người dùng (Điện thoại / Trình duyệt)
  ├─ Telegram (kênh tương tác chính)
  ├─ GitHub Actions (chạy tác vụ theo nhu cầu qua OpenRouter)
  └─ Google Colab (chạy tác vụ nặng: ComfyUI, Model xử lý ảnh/video)
          │
          ▼
Cloudflare Worker Proxy (worker/telegram-proxy)
          │
          ▼
Hermes Gateway / Agent Runtime (agents/hermes)
  ├─ Multi-Model Routing
  │    ├─ OpenRouter / ChatGPT (chiến lược, code, tạo ảnh)
  │    ├─ Claude / Anthropic (lập trình chuyên sâu, refactor)
  │    └─ Google Gemini (nghiên cứu, phân tích, xử lý media)
  ├─ Bộ nhớ thứ hai (Second Brain)
  │    ├─ Import ChatGPT / Claude / Gemini exports
  │    └─ Memory recall & durable facts
  ├─ Skills & Tools
  │    ├─ QAI Developer Manager
  │    ├─ Hermes Project Analyst
  │    └─ Terminal / Git / Web search
  └─ Output Artifacts & Git Sync
```

## 3. Kiến trúc triển khai Cloud-First

```text
+-----------------------+      +---------------------------+
|    GitHub Actions     |      |    Cloudflare Worker      |
|  (Hermes Task Runner) |      | (Telegram Webhook Proxy)  |
+-----------------------+      +---------------------------+
            |                                |
            |                                v
            |                  +---------------------------+
            +----------------->|    Hermes Agent Runtime   |
                               |  (Termux / VPS / Cloud)   |
                               +---------------------------+
                                             |
                                             v
                               +---------------------------+
                               |     Google Colab / GPU    |
                               |    (ComfyUI / Heavy AI)   |
                               +---------------------------+
```

1. **GitHub Actions:** Chạy các tác vụ một lần (one-shot), viết code, tạo ảnh qua OpenRouter API. Hoàn toàn miễn phí trên repo public.
2. **Cloudflare Worker:** Làm lớp đệm proxy an toàn cho Telegram Webhook, không lưu key, chuyển tiếp trực tiếp về Hermes Gateway.
3. **Google Colab:** Môi trường GPU tạm thời để chạy ComfyUI tạo ảnh/video chất lượng cao.
4. **Second Brain:** Module độc lập trích xuất lịch sử các AI bên ngoài về định dạng Markdown.

## 4. Ranh giới dữ liệu & Bảo mật

- **GitHub Repository (`ZeusopenAI/ZEUS`):** Lưu mã nguồn, workflow, tài liệu, script. Tuyệt đối KHÔNG lưu secret hay file `.env`.
- **GitHub Secrets:** Lưu `OPENROUTER_API_KEY` và các credential phục vụ CI/Actions.
- **`~/.hermes/` (Local runtime):** Lưu config cục bộ, session, memory imports và logs (phân quyền mode 600/700).
- **Cloudflare Worker Secrets:** Lưu `WEBHOOK_SECRET` và `UPSTREAM_URL`.

## 5. Cấu trúc thư mục (Layout chuẩn)

```text
ZEUS/
  .github/workflows/    # Workflows tự động hóa Actions
  agents/hermes/        # Runtime Hermes AI Agent
  colab/                # Script khởi động trên Google Colab
  docs/                 # Runbook, tài liệu kiến trúc & hướng dẫn
  scripts/              # Bộ công cụ second-brain, hotfix, sync script
  skills/               # Các kỹ năng tùy biến cho Agent
  worker/               # Cloudflare Worker proxy cho Telegram
```
