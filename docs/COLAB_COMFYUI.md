# Tạo ảnh & video bằng ComfyUI trên Google Colab Free (từ điện thoại)

Cập nhật: 2026-09-12 · Ngữ cảnh: không có máy tính/GPU riêng, chỉ có điện thoại (Termux).
Mục đích: thỉnh thoảng cần tạo ảnh/video bằng model mở (free, không watermark, không phí per-image).

## 1. Vì sao Colab Free + ComfyUI

- **Colab free** cho GPU **Tesla T4 16GB VRAM** mỗi phiên, khoảng 15–30 giờ/tuần.
- **ComfyUI** là giao diện node-based chạy các model **open-weight** (SDXL, FLUX,
  Wan, LTX…) → tạo bao nhiêu cũng không mất phí per-image/video, khác với
  fal.ai/Hailuo/Veo (tính tiền từng lần).
- Khớp với kiến trúc Zeus: Colab là "máy chạy tạm" (xem `AGENTS.md`), chỉ bật
  khi cần, không chạy bot 24/7.

**Lưu ý giới hạn của Colab free** (chấp nhận được vì chỉ dùng lúc cần):

- Phiên bị **ngắt khi idle ~90 phút** (và khi hết hạn phiên).
- GPU free là **T4 (16GB)** — chạy tốt ảnh 1024px và video ngắn với model
  lượng tử hóa (GGUF/fp8); model nặng sẽ chậm.
- Đường hầm truy cập là URL `trycloudflare.com` **đổi mỗi lần chạy**.

## 2. Cách chạy nhanh nhất (điện thoại)

Dùng **notebook chính thức** của ComfyUI (ổn định nhất, có sẵn cloudflared):

1. Mở trên điện thoại: `https://colab.research.google.com/github/comfyanonymous/ComfyUI/blob/master/notebooks/comfyui_colab.ipynb`
   (repo: `comfyanonymous/ComfyUI`, file `notebooks/comfyui_colab.ipynb`).
2. Menu **Runtime → Change runtime type → T4 GPU** → Save.
3. Chạy từng cell từ trên xuống:
   - cell cài ComfyUI + dependencies (mất ~5–10 phút lần đầu);
   - cell mount Google Drive (để lưu model + output);
   - cell khởi động + in ra link `https://xxxx.trycloudflare.com`.
4. Bấm link đó → giao diện ComfyUI mở trong trình duyệt điện thoại.

> Nếu notebook chính thức bị lỗi ở đợt nào đó, dùng template cộng đồng
> `comfyui_colab_with_manager.ipynb` (có sẵn ComfyUI-Manager để cài node/model
> ngay trong web UI).

## 3. Model phù hợp với T4 16GB

| Nhu cầu | Model | VRAM/đĩa | Tốc độ trên T4 | Ghi chú |
| --- | --- | --- | --- | --- |
| Ảnh nhanh | **SDXL** (`sd_xl_base_1.0.safetensors`) | 8–10 GB | ~30s/ảnh | chuẩn, nhẹ |
| Ảnh đẹp nhất | **FLUX.1 [dev]** bản fp8/GGUF | ~12 GB VRAM + ~24 GB đĩa | vài phút/ảnh | dùng GGUF Q4/Q5 để vừa T4 |
| Video nhanh | **LTX 2.3** | nhẹ | nhanh | text→video + image→video |
| Video chất lượng | **Wan 2.2 14B** bản GGUF Q4/Q5 | vừa T4 | ~15–20 phút/clip | không chạy fp16 (tràn VRAM) |
| Video nhẹ (ảnh động) | **AnimateDiff** (nền SD1.5) | nhẹ | nhanh | clip ngắn |

Repo Zeus đã có sẵn workflow mẫu tại
`agents/hermes/skills/creative/comfyui/workflows/`:
`flux_dev_txt2img.json`, `wan_video_t2v.json`, `animatediff_video.json`,
`sdxl_txt2img.json`, `sdxl_img2img.json`, `sdxl_inpaint.json`, `upscale_4x.json`.
Tải lên giao diện ComfyUI (nút Load) là dùng được ngay.

## 4. Chống mất dữ liệu khi bị ngắt

Vì phiên hay bị ngắt, làm 3 việc này để lần sau chạy lại nhanh:

1. **Mount Google Drive** ngay cell đầu; đặt model + output vào Drive:
   - model → `MyDrive/ComfyUI/models/...`
   - output → `MyDrive/ComfyUI/output/...`
   ⇒ Model **tải 1 lần vào Drive**, các phiên sau chỉ mount lại, khỏi tải lại 5–24 GB.
2. **Lưu workflow JSON** vào Drive/repo trước khi tắt phiên (để khỏi kéo lại từng node).
3. **Tải output về máy ngay** sau mỗi lần tạo (ảnh/video nằm trong Drive output).

## 5. Ranh giới với bot Telegram (đừng nhầm)

- **Chat/bộ não** của bot Telegram **KHÔNG chạy trên Colab** (Colab hay bị ngắt).
  Chat dùng Hermes gateway + provider free (GLM/Novita/Ollama Cloud) như trong
  `docs/TELEGRAM_WIRING.md`.
- **Ảnh/video** là việc *thỉnh thoảng, thủ công*: bật Colab → tạo → lưu Drive.
  Nếu sau này muốn bot tự tạo ảnh/video từ Telegram, đi theo hướng backend
  FAL (`image_generate` / `video_generate` của Hermes) thay vì Colab, vì bot
  cần dịch vụ luôn online.

## 6. An toàn

- **Không nhét API key/token** vào notebook (Colab có thể bị chia sẻ/lưu lại).
- Không dùng Colab free để chạy bot 24/7 — vi phạm chính sách và không bền.
- Giữ model open-weight có license phù hợp (FLUX.1 dev: non-commercial;
  FLUX.1 schnell/SDXL: thoải mái hơn).
