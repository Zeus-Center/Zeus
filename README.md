# ZEUS — Hệ Thống AI Automation Cá Nhân (ZeusopenAI)

> **"GỌI BẤT KỲ AI NÀO KHI CẦN NGAY TRÊN BÀN PHÍM ĐIỆN THOẠI & TRÌNH DUYỆT"**

Dự án AI Automation cá nhân và trợ lý đa năng cho thương hiệu cá nhân **Nguyễn Quang Quý**. Tối ưu cho vận hành gọn nhẹ (Phone/Cloud-first), không cồng kềnh, không phụ thuộc hạ tầng doanh nghiệp phức tạp.

---

## 🎯 Mục Tiêu & Triết Lý

- **Cá nhân hóa & Linh hoạt:** Không quản lý kiểu monorepo doanh nghiệp nặng nề; mọi module độc lập, tinh gọn, dễ bảo trì.
- **Cloud-First & Mobile-First:** Điều khiển và chạy tác vụ trực tiếp từ điện thoại (Telegram / GitHub Actions / Google Colab / Trình duyệt).
- **Phối hợp Đa Model (Multi-Model Routing):**
  - **Hermes Agent (Local / Cloud):** Điều phối, chạy tool, lập trình và thực thi tác vụ.
  - **ChatGPT / OpenRouter:** Chiến lược, kế hoạch, copywriting, tạo ảnh.
  - **Claude:** Kiến trúc chuyên sâu, refactoring mã nguồn.
  - **Gemini:** Nghiên cứu tài liệu, media, xử lý Colab/Python.
- **Bộ nhớ thứ hai (Second Brain):** Gom toàn bộ lịch sử trao đổi của ChatGPT, Claude, Gemini về kho Markdown thống nhất, bảo mật (tự động xóa secrets).

---

## 📂 Cấu Trúc Kho Mã Nguồn

```text
.
├── .github/workflows/          # Tự động hóa GitHub Actions
│   ├── hermes-openrouter.yml   # Chạy Hermes Agent + tạo ảnh bằng OpenRouter qua 1 nút bấm
│   ├── arena-auto-pr.yml       # Tự động mở PR khi có cập nhật code từ Arena
│   ├── hermes-gemini-hotfix-ci.yml # CI kiểm thử bộ sửa lỗi Gemini
│   └── qai-developer-manager-10x-ci.yml # CI kiểm thử skill quản lý code
├── agents/
│   └── hermes/                 # Runtime Hermes AI Agent (NousResearch/hermes-agent)
├── colab/
│   └── bootstrap.py            # Script khởi động tự động trên Google Colab
├── docs/                       # Tài liệu hướng dẫn & vận hành
│   ├── HERMES_ACTIONS.md       # Hướng dẫn chạy Hermes qua GitHub Actions (OpenRouter)
│   ├── TELEGRAM_WIRING.md      # Runbook kết nối Telegram Webhook & chẩn đoán lỗi 409
│   ├── second-brain.md         # Hướng dẫn gom bộ nhớ từ ChatGPT/Claude/Gemini
│   ├── COLAB_COMFYUI.md        # Hướng dẫn chạy ComfyUI / Stable Diffusion trên Colab
│   ├── CLOUD_ARCHITECTURE.md   # Kiến trúc vận hành Cloud-First từ điện thoại
│   └── SecretManagement.md     # Quy tắc quản lý biến môi trường và khóa API
├── scripts/                    # Bộ công cụ & script tiện ích
│   ├── second-brain-import.mjs # Script độc lập nhập lịch sử chat (Node.js >= 22)
│   ├── second-brain/           # Module lõi xử lý chuẩn hóa hội thoại
│   ├── hermes-gemini-hotfix.sh # Sửa lỗi xác thực Google Gemini native
│   ├── hermes-gemini-auth-recover.sh # Khôi phục key Gemini an toàn
│   └── sync-to-zeusopenai.sh   # Đồng bộ mã nguồn sang repo ZeusopenAI/ZEUS
├── skills/                     # Kỹ năng tùy chỉnh cho Agent
│   ├── qai-developer-manager/  # Kỹ năng kỹ sư trưởng quản lý code & CI
│   ├── hermes-project-analyst-code-manager/ # Kỹ năng phân tích & chẩn đoán Hermes
│   └── second-brain/           # Kỹ năng tra cứu & quản lý bộ nhớ dùng chung
└── worker/
    └── telegram-proxy/         # Cloudflare Worker proxy mỏng cho Telegram Webhook
```

---

## 🚀 Các Tính Năng Nổi Bật

### 1. Chạy Hermes Agent Miễn Phí trên GitHub Actions (`hermes-openrouter.yml`)
- Không cần máy tính bật 24/7, không cần Codespaces hay thẻ tín dụng.
- Vào tab **Actions** → chọn **Hermes task runner (OpenRouter)** → bấm **Run workflow**.
- Hỗ trợ cả **chế độ tạo ảnh** (`image_gen` với Gemini Flash Image) và sinh code/văn bản.
- Kết quả tự động tải về qua Artifacts hoặc mở Pull Request về nhánh `main`.

### 2. Bộ Nhớ Thứ Hai (Second Brain Importer)
- Nhập toàn bộ dữ liệu lịch sử chat từ ChatGPT (`conversations.json`), Claude.ai, Google Gemini (Takeout) thành các ghi chú Markdown.
- Chạy bằng script standalone siêu nhẹ (Node.js ≥ 22):
  ```bash
  node scripts/second-brain-import.mjs import chatgpt --from ~/Downloads/conversations.json
  node scripts/second-brain-import.mjs import claude-ai --from ~/Downloads/claude-export/
  node scripts/second-brain-import.mjs import gemini --from ~/Downloads/Takeout/Gemini/
  node scripts/second-brain-import.mjs ingest --from ~/Downloads/ai-inbox/
  ```

### 3. Telegram Webhook Proxy Mỏng (`worker/telegram-proxy/`)
- Proxy Cloudflare Worker gọn nhẹ, không lưu trữ token bot hay key mô hình ở edge.
- Chuyển tiếp an toàn webhook từ Telegram về máy chủ Hermes Gateway (Termux/VPS qua Cloudflare Tunnel), loại bỏ hoàn toàn tình trạng xung đột HTTP 409 "lúc gọi được lúc không".

### 4. Tác Vụ Nặng trên Google Colab (`colab/`)
- Mở notebook Colab trên điện thoại, chạy `colab/bootstrap.py` để kéo repo và thực thi các mô hình AI hoặc ComfyUI tạo ảnh/video chất lượng cao.

---

## 🔒 Quy Tắc Bảo Mật Bắt Buộc

1. **Tuyệt đối không commit API Key, Token, Mật khẩu, hoặc file `.env` lên GitHub.**
2. Tất cả key mô hình và token bot nạp qua **GitHub Secrets**, **Cloudflare Worker Secrets**, hoặc biến môi trường `~/.hermes/.env` (mode 600).
3. Sử dụng công cụ `second-brain-import` tự động lọc bỏ (redact) các secret khi import dữ liệu lịch sử chat.
4. Mọi tác vụ nhạy cảm (xóa dữ liệu, triển khai production) phải có sự xác nhận của người quản trị.

---

## 📖 Tài Liệu Chi Tiết

- [Kiến trúc hệ thống (Architecture)](Architecture.md)
- [Trạng thái hiện tại (Status)](Status.md)
- [Kế hoạch & Nhiệm vụ (TODO)](TODO.md)
- [Lộ trình phát triển (Roadmap)](Roadmap.md)
- [Vận hành & Triển khai (Deployment)](Deployment.md)
- [Tác vụ Agent (AGENTS)](AGENTS.md)
- [Chạy Hermes Actions](docs/HERMES_ACTIONS.md)
- [Kết nối Telegram Bot](docs/TELEGRAM_WIRING.md)
- [Bộ nhớ thứ hai](docs/second-brain.md)
- [ComfyUI Colab](docs/COLAB_COMFYUI.md)
