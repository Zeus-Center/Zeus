# Chạy Hermes bằng OpenRouter trên GitHub Actions

Hướng dẫn này dành cho repo **Zeus-Center/Zeus** — không cần thẻ tín dụng, không cần Codespaces.

## Có 2 workflow mới

| Workflow | Việc | Tốn gì? |
|---|---|---|
| **Hermes task runner (OpenRouter)** | Chạy Hermes agent với 1 nhiệm vụ bạn nhập: viết code, xử lý file, **tạo ảnh**… | Tiêu credit **OpenRouter** của bạn mỗi lần chạy (GitHub miễn phí vì repo public) |
| **Arena → auto PR sync** | Mỗi lần agent Arena push code lên nhánh `arena/**`, tự động mở Pull Request về `main` | **Miễn phí 100%** |

## 1. Chạy Hermes với OPENROUTER_API_KEY

Key đã được lưu ở **Settings → Secrets and variables → Actions** dưới tên `OPENROUTER_API_KEY` — workflow đã được nối sẵn tới đúng tên này.

Cách chạy:

1. Mở tab **Actions** của repo.
2. Chọn workflow **Hermes task runner (OpenRouter)** ở cột trái.
3. Bấm nút **Run workflow** (bên phải).
4. Điền:
   - **prompt**: nhiệm vụ, VD `Tạo ảnh một con rồng xanh bay trên thành phố` hoặc `Viết script python đổi tên file hàng loạt`.
   - **model**: model OpenRouter cho văn bản/code (mặc định `google/gemini-2.5-flash`).
   - **image_mode**: bật nếu muốn **tạo ảnh** (tự đổi sang toolset `image_gen` + model `google/gemini-2.5-flash-image`).
   - **max_turns**: giới hạn bước tool — tăng nếu việc phức tạp (mỗi bước tốn token = tốn credit).
   - **save_to_repo**: bật → kết quả được commit lên nhánh `hermes-runs/<số>` + tự mở PR.
5. Bấm **Run workflow** xanh lá → chờ vài phút.

### Lấy kết quả ở đâu

- **Artifacts**: mở run vừa chạy → cuộn xuống mục *Artifacts* → tải `hermes-output-<id>` (log + file agent tạo ra).
- **Pull Request**: nếu bật `save_to_repo`, tab **Pull requests** sẽ có PR mới chứa file kết quả → xem → **Merge** để đưa vào `main` (hoặc đóng PR nếu không ưng).

## 2. Đồng bộ code từ Arena về GitHub

Không cần cấu hình gì thêm:

1. Trong phiên Arena, agent sửa code → commit → push lên nhánh `arena/...`.
2. Workflow **Arena → auto PR sync** tự mở PR về `main` ngay khi có push.
3. Bạn chỉ việc bấm **Merge** trên điện thoại/máy tính.

> Phần này chỉ dùng `GITHUB_TOKEN` tích hợp sẵn của Actions — **không đụng tới OpenRouter, không tốn xu nào**.

## Chi phí & an toàn cần nhớ

- GitHub Actions trên repo **public**: **miễn phí**.
- Mỗi lần chạy Hermes runner: trừ **credit OpenRouter** theo model bạn chọn — xem giá từng model tại <https://openrouter.ai/models>. Model ảnh/văn bản mạnh tốn hơn; giữ `max_turns` thấp để chắc chắn không chạy lố.
- Secret **không bao giờ hiện trong log**; workflow chỉ chạy thủ công do bạn bấm → không ai khác xài key của bạn được.
- Nếu bước "mở PR" báo lỗi *Permission denied / 403*: vào **Settings → Actions → General → Workflow permissions** → chọn **Read and write permissions** → Save.

## Sửa/tắt

- File workflow: `.github/workflows/hermes-openrouter.yml` và `.github/workflows/arena-auto-pr.yml`.
- Muốn tắt: **Settings → Actions → Disable Actions**, hoặc xóa 2 file đó.
