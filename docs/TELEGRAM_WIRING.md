# Nối điện Telegram — Hermes Gateway + Cloudflare Worker

Cập nhật: 2026-09-06 · Nguồn phân tích: `agents/hermes/plugins/platforms/telegram/adapter.py`,
`telegram_network.py`, `telegram_ids.py`, `hermes_cli/telegram_managed_bot.py`,
`agents/hermes/website/docs/user-guide/messaging/telegram.md`.

## 1. Adapter Telegram cần gì (đọc từ code)

### 1.1 Biến bắt buộc / thường dùng

| Biến env | Bắt buộc | Ý nghĩa |
| --- | --- | --- |
| `TELEGRAM_BOT_TOKEN` | ✅ | Token bot từ @BotFather, dạng `123456789:ABC...` |
| `TELEGRAM_ALLOWED_USERS` | khuyến nghị | Danh sách user ID (số) được phép nói chuyện, cách nhau dấu phẩy |
| `TELEGRAM_ALLOW_ALL_USERS` | tùy chọn | `true` = cho mọi người dùng (chỉ dev) |
| `TELEGRAM_WEBHOOK_URL` | khi dùng webhook | URL HTTPS công khai Telegram sẽ POST update tới |
| `TELEGRAM_WEBHOOK_SECRET` | **bắt buộc khi có URL** | Secret xác thực update; thiếu → gateway **từ chối khởi động** (GHSA-3vpc-7q5r-276h) |
| `TELEGRAM_WEBHOOK_PORT` | tùy chọn | Cổng webhook server lắng nghe, mặc định `8443` |
| `TELEGRAM_PROXY` | tùy chọn | Proxy cho kết nối Telegram (`socks5://…`, `http://…`, `https://…`) |

Nhóm/chat: `TELEGRAM_ALLOWED_CHATS`, `TELEGRAM_GROUP_ALLOWED_CHATS`,
`TELEGRAM_GROUP_ALLOWED_USERS`, `TELEGRAM_HOME_CHANNEL`,
`TELEGRAM_HOME_CHANNEL_NAME`, `TELEGRAM_HOME_CHANNEL_THREAD_ID`,
`TELEGRAM_CRON_THREAD_ID`, `TELEGRAM_ALLOW_BOTS`,
`TELEGRAM_OBSERVE_UNMENTIONED_GROUP_MESSAGES`.

### 1.2 Hai chế độ hoạt động

| | **Polling (mặc định)** | **Webhook** |
| --- | --- | --- |
| Chiều kết nối | Gateway **gọi ra** Telegram (`getUpdates`) | Telegram **đẩy vào** endpoint của gateway |
| Phù hợp | Máy luôn bật: VPS, Termux luôn chạy | Cloud tự đánh thức khi có tin (Fly/Railway/Workers) |
| Cấu hình | không cần gì thêm | `TELEGRAM_WEBHOOK_URL` + `TELEGRAM_WEBHOOK_SECRET` |

- Webhook server lắng nghe `0.0.0.0:<port>`; PTB xác thực update bằng
  `secret_token` (header `X-Telegram-Bot-Api-Secret-Token`).
- Polling: trước khi poll, adapter gọi `deleteWebhook` best-effort để xóa
  webhook cũ còn sót.

### 1.3 Cơ chế chịu lỗi (đã có sẵn)

- **Xung đột 409 (`Conflict` / "terminated by other getUpdates request" /
  "another bot instance is running")** → adapter tự chờ + thử lại tối đa 5 lần
  (backoff 15s→55s), rồi mới báo lỗi fatal.
- **Lỗi mạng** tới `api.telegram.org` → fallback transport: giữ nguyên host/SNI
  `api.telegram.org` nhưng thử lại TCP qua IP khác; tự khám phá IP qua
  DNS-over-HTTPS (Google/Cloudflare) rồi đến seed IP `149.154.166.110/220`.
- Nếu bootstrap polling thất bại, gateway **vẫn sống** ở "degraded mode" và retry
  nền — vì vậy bot có thể "lúc được lúc không" mà process không chết.

## 2. Vai trò Cloudflare Worker — topology ĐÚNG

⚠️ **Nguyên tắc số 1: một bot token chỉ có MỘT consumer duy nhất.**
Telegram không cho phép 2 tiến trình cùng `getUpdates` một token, và khi đã
`setWebhook` thì `getUpdates` (polling) bị vô hiệu. Vi phạm → **409 xen kẽ =
đúng triệu chứng "lúc gọi được lúc không".**

Ba cách kết nối hợp lệ (chọn MỘT). **ĐÃ CHỐT: phương án A — Zeus/Hermes làm
bộ não, Worker chỉ là proxy mỏng.** Code Worker nằm ở `worker/telegram-proxy/`.

**A. Worker = webhook proxy (edge) → forward về Hermes gateway ✅ (đã chọn):**
```text
Telegram ──POST──▶ Cloudflare Worker (https://<worker>.workers.dev/telegram)
                        │ 1) kiểm tra header X-Telegram-Bot-Api-Secret-Token (fail-closed 401)
                        │ 2) forward nguyên vẹn body + header secret
                        ▼
              Hermes gateway webhook server (0.0.0.0:8443/telegram, qua tunnel)
```
- `.env` gateway: `TELEGRAM_WEBHOOK_URL=https://<worker>.workers.dev/telegram`,
  `TELEGRAM_WEBHOOK_SECRET=<cùng secret>`, `TELEGRAM_WEBHOOK_PORT=8443`.
- Worker **chuyển tiếp, không tự xử lý**: giữ nguyên body + header secret;
  KHÔNG gọi `getUpdates`, KHÔNG gọi `setWebhook`, KHÔNG giữ bot token hay key model.
- Secret của Worker gồm đúng 2 giá trị (nạp qua `wrangler secret put`):
  `WEBHOOK_SECRET` (= `TELEGRAM_WEBHOOK_SECRET` của gateway) và `UPSTREAM_URL`
  (URL đầy đủ tới webhook server gateway, kể cả path `/telegram`).

**B. Worker tự xử lý toàn bộ (webhook handler + gọi model):** bỏ phần Telegram
của Hermes, Worker làm hết. Đơn giản nhưng mất toàn bộ tính năng Hermes
(session, memory, skills, cron…). Không khuyến nghị cho mục tiêu "Zeus làm bộ não".

**C. Bỏ Worker — Hermes gateway polling trực tiếp (đơn giản nhất):** cần máy
luôn bật (VPS Ubuntu). Khi chuyển từ webhook→polling phải **xóa webhook cũ** (bấm
"Webhook Info → Delete webhook" trong Cloudflare Dashboard nếu bạn từng đặt, hoặc
gọi `deleteWebhook`) — nếu không bot sẽ không nhận update qua polling.

### 2.1 Deploy Worker proxy (phương án A)

```bash
cd worker/telegram-proxy
npx wrangler login                                  # lần đầu
npx wrangler secret put WEBHOOK_SECRET              # = TELEGRAM_WEBHOOK_SECRET (openssl rand -hex 32)
npx wrangler secret put UPSTREAM_URL                # = https://<tunnel>.trycloudflare.com/telegram
npx wrangler deploy
```

Worker lắng nghe path `WEBHOOK_PATH` (mặc định `/telegram`); `GET /` và
`GET /health` trả JSON để uptime-monitor. POST tới `/telegram` được kiểm tra
secret trước khi forward; upstream không tới được → trả `502` (thay vì giả `200 OK`).

Thay Worker cũ `cool-unit-a53f`: deploy code này đè lên (hoặc tạo Worker mới rồi
xóa cái cũ) và **xóa toàn bộ secret cũ** trong dashboard — token bot cũ + Gemini
key cũ đã rò rỉ phải coi là compromised và revoke ở nơi cấp.

### 2.2 Đường hầm Worker → gateway

Hermes webhook server lắng nghe `0.0.0.0:8443`. Cần một đường HTTPS công khai để
Worker forward vào (chọn một):

| Cách | Lệnh | Ghi chú |
| --- | --- | --- |
| Cloudflare Tunnel | `cloudflared tunnel --url http://localhost:8443` (named tunnel + public hostname) | URL ổn định, khuyến nghị |
| Quick Tunnel | `cloudflared tunnel --url http://localhost:8443` | URL `trycloudflare.com` đổi mỗi lần chạy → phải cập nhật `UPSTREAM_URL` |
| VPS public | mở port 8443 + TLS/domain | tự quản firewall |

`UPSTREAM_URL` phải là **URL đầy đủ kể cả path** và path đó phải khớp với
`url_path` mà Hermes lấy từ `TELEGRAM_WEBHOOK_URL` (xem 1.1): ví dụ
`https://hermes-tel.example.com/telegram`.

## 3. Checklist nối điện từng bước

- [ ] **B0 — Topology:** đã chốt **A** (Worker proxy mỏng `worker/telegram-proxy/` → Hermes gateway).
- [ ] **B1 — BotFather:** tạo bot (đã có) → lấy `TELEGRAM_BOT_TOKEN`; `/setprivacy` → **Disable** (nếu dùng nhóm); `/setcommands`.
- [ ] **B2 — Lấy user ID:** nhắn @userinfobot, lưu số ID của bạn.
- [ ] **B3 — Ghi secret ngoài Git:** `~/.hermes/.env` (mode 600):
      ```
      TELEGRAM_BOT_TOKEN=...
      TELEGRAM_ALLOWED_USERS=<user_id_của_bạn>
      ```
      Không commit file này (đã có trong `.gitignore`).
- [ ] **B4 — Chế độ webhook (A):** thêm `TELEGRAM_WEBHOOK_URL=https://<worker>.workers.dev/telegram`,
      `TELEGRAM_WEBHOOK_SECRET=$(openssl rand -hex 32)` (dán cùng giá trị vào `WEBHOOK_SECRET` của Worker).
- [ ] **B5 — Xóa mọi consumer cũ:** đảm bảo Cloudflare Worker (nếu có) đã tắt `getUpdates`/`setWebhook`; chỉ 1 nơi tiêu thụ token.
- [ ] **B6 — Chạy:** `hermes gateway` (hoặc tmux supervisor). Đọc log chờ dòng
      `[telegram] Connected to Telegram (polling mode)` / `(webhook mode)`.
- [ ] **B7 — Test hai chiều:** DM một câu → bot trả lời; gửi voice, ảnh, file.
- [ ] **B8 — Kiểm tra nhóm + cron:** `/sethome`; chạy 1 cron job → kết quả về home channel.
- [ ] **B9 — Bền vững:** health check, restart policy, log rotation; để ý dòng "degraded mode" và "polling conflict" trong log.

## 4. Debug "lúc gọi được lúc không"

| Triệu chứng | Nguyên nhân khả dĩ | Cách sửa |
| --- | --- | --- |
| Log có `Conflict` / `terminated by other getUpdates request` / `another bot instance` | **2 consumer 1 token** (Worker + gateway cùng poll, hoặc 2 gateway) | Chỉ giữ 1 nơi tiêu thụ token; tắt Worker poll/webhook hoặc tắt gateway thứ 2 |
| Log `Connected in degraded Telegram mode` | Mạng không tới `api.telegram.org` (nhà mạng chặn) | Bật `TELEGRAM_PROXY`; xác nhận fallback IP đang hoạt động |
| Bot im lặng dù đã "webhook listening" | Worker không forward đúng, hoặc sai secret | Kiểm tra Worker giữ nguyên body + header `X-Telegram-Bot-Api-Secret-Token`; secret 2 nơi phải khớp |
| DM không được trả lời | `TELEGRAM_ALLOWED_USERS` sai ID | Kiểm tra lại user ID qua @userinfobot |
| Nhóm không thấy tin | Privacy mode ON | BotFather → Group Privacy → Turn off; gỡ + thêm bot lại vào nhóm |
| Webhook bị set mà đang chạy polling | Webhook cũ còn sót | Gọi `deleteWebhook` (hoặc xóa trên dashboard) rồi khởi động lại polling |

Lệnh kiểm tra nhanh (có token + curl):
```bash
curl -s "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
# url != "" → webhook đang bật; pending_update_count tích tụ → update không được tiêu thụ
```

## 5. Tóm tắt cho người vận hành

Bot Telegram của Hermes **chỉ cần đúng 2 thứ** để chạy DM: `TELEGRAM_BOT_TOKEN` +
`TELEGRAM_ALLOWED_USERS`. Mọi triệu chứng chập chờn gần như luôn quy về **một bot
token bị 2 nơi cùng tiêu thụ** (Worker + gateway, hoặc webhook + polling cùng lúc).
Sửa bằng cách chọn đúng 1 topology ở mục 2 và xóa consumer còn lại.
