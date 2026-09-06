# Zeus Telegram Webhook Proxy (Worker mỏng — phương án A)

Worker Cloudflare này chỉ là **proxy chuyển tiếp webhook**. Toàn bộ "bộ não"
(model, memory, skills, cron, allowlist) nằm ở **Hermes gateway** — Worker
không giữ bot token, không gọi model, không `getUpdates`, không `setWebhook`.

```text
Telegram ──POST──▶ Cloudflare Worker (https://<worker>.workers.dev/telegram)
                        │  kiểm tra X-Telegram-Bot-Api-Secret-Token (edge)
                        │  forward body + header nguyên vẹn
                        ▼
        Hermes gateway webhook server (0.0.0.0:8443/telegram)
```

## Vì sao vậy

- **Một bot token chỉ có MỘT consumer.** Worker chỉ forward; token được tiêu
  thụ duy nhất bởi Hermes gateway.
- **Worker không chứa secret nào khác ngoài secret chung + URL upstream.**
  Không có `TELEGRAM_BOT_TOKEN`, không có Gemini/Veo key trong code.

## Thư mục

```
worker/telegram-proxy/
├── src/index.js          # mã nguồn Worker (vanilla, không dependency)
├── wrangler.toml         # cấu hình deploy; secrets để trống, nạp qua CLI
├── hermes.env.example    # mẫu .env cho Hermes gateway (chế độ webhook)
└── README.md             # file này
```

## Deploy Worker

```bash
cd worker/telegram-proxy

# 1) Đăng nhập Cloudflare (nếu chưa)
npx wrangler login

# 2) Nạp secrets (KHÔNG ghi vào wrangler.toml, KHÔNG commit)
npx wrangler secret put WEBHOOK_SECRET   # = TELEGRAM_WEBHOOK_SECRET của Hermes
npx wrangler secret put UPSTREAM_URL     # = https://<tunnel>.trycloudflare.com/telegram

# 3) Deploy
npx wrangler deploy
```

Sau khi deploy, URL webhook của Worker có dạng
`https://zeus-telegram-proxy.<subdomain>.workers.dev/telegram`. Nếu bạn đang
thay thế Worker cũ `cool-unit-a53f`: mở Cloudflare Dashboard → Workers →
`cool-unit-a53f` → **deploy code này thay thế**, hoặc tạo Worker mới rồi xóa
`cool-unit-a53f` — quan trọng nhất là **xóa toàn bộ secret cũ của Worker cũ**
(token bot cũ + Gemini key cũ, vốn đã bị rò rỉ → phải coi là compromised và
revoke nơi cấp nếu chưa làm).

## Đường hầm Worker → Hermes gateway

Worker chạy trên edge Cloudflare, còn Hermes webhook server lắng nghe
`0.0.0.0:8443` trên máy chủ (Termux/VPS). Cần MỘT đường HTTPS công khai tới
cổng đó để Worker forward. Chọn một trong các cách:

| Cách | Lệnh / mô tả | Ghi chú |
| --- | --- | --- |
| **Cloudflare Tunnel (khuyến nghị)** | `cloudflared tunnel --url http://localhost:8443` hoặc tunnel named + public hostname `hermes-tel.example.com` → `http://localhost:8443` | URL ổn định, miễn phí, cùng hạ tầng Cloudflare |
| Quick Tunnel (thử nhanh) | `cloudflared tunnel --url http://localhost:8443` | URL `https://xxxx.trycloudflare.com` **đổi mỗi lần chạy**; phải `wrangler secret put UPSTREAM_URL` lại |
| VPS public | mở port 8443, trỏ domain/IPTables | tự quản firewall + TLS |

Đặt `UPSTREAM_URL` = **URL đầy đủ kể cả path `/telegram`** của tunnel, ví dụ
`https://hermes-tel.example.com/telegram` (path phải khớp với `url_path` mà
Hermes lấy từ `TELEGRAM_WEBHOOK_URL`).

## Hermes gateway

Xem `hermes.env.example` kèm theo và `docs/TELEGRAM_WIRING.md`. Tóm tắt `.env`:

```bash
TELEGRAM_BOT_TOKEN=...                     # token MỚI (token cũ đã revoke)
TELEGRAM_ALLOWED_USERS=<user_id>           # chỉ bạn
TELEGRAM_WEBHOOK_URL=https://<worker>.workers.dev/telegram
TELEGRAM_WEBHOOK_SECRET=<giống WEBHOOK_SECRET của Worker>
TELEGRAM_WEBHOOK_PORT=8443
```

Khởi động gateway: `hermes gateway`. Kỳ vọng log:
`[telegram] Webhook server listening on 0.0.0.0:8443/telegram`.

## Kiểm tra nhanh

```bash
# Health check Worker
curl -s https://<worker>.workers.dev/health

# Thử gửi update giả (phải khớp secret, nếu không bị 401)
curl -s -X POST https://<worker>.workers.dev/telegram \
  -H 'Content-Type: application/json' \
  -H "X-Telegram-Bot-Api-Secret-Token: <secret>" \
  -d '{"update_id":1,"message":{"message_id":1,"chat":{"id":1},"text":"ping"}}'

# Xem trạng thái webhook thật của Telegram
curl -s "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

`getWebhookInfo.url` phải bằng `https://<worker>.workers.dev/telegram` và
`last_error_message` trống sau một DM test.
