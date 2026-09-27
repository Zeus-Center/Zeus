# BRAIN MEMORY — FLOWKIT AI FILMMAKING PIPELINE (GEMINI + GOOGLE FLOW/VEO)

- **Thời điểm ghi nhận:** 2026-09-27
- **Chủ đề:** Tự động hóa sản xuất phim AI & Video Marketing (End-to-End AI Video Pipeline)

---

## 1. Bản chất công nghệ & Khái niệm cốt lõi
* **FlowKit** là hệ thống tự động hóa làm phim AI cục bộ (Local + Cloud Bridge), kết hợp:
  * **Gemini AI:** Lập kế hoạch phân cảnh, phân tách thực thể, viết prompt hành động, sinh giọng đọc TTS và bắt word timings để tạo sub.
  * **Google Flow (Veo / VideoFX):** Sinh video chất lượng cao dựa trên tài khoản Google qua Chrome Extension MV3 bridge (không tốn chi phí API video đắt đỏ).
  * **FFmpeg:** Tự động ghép nối clip, khớp timing âm thanh, chèn phụ đề động `.srt` và lồng nhạc nền (Ducked Music).
  * **SQLite / FastAPI:** Quản lý hàng đợi render và lưu trữ dự án.

---

## 2. Giải pháp cho bài toán "Nhất quán nhân vật" (Character Consistency)
* **Reference Image System:** Mỗi nhân vật, địa điểm, đạo cụ được gán 1 UUID media_id và 1 ảnh tham chiếu riêng (chỉ mô tả ngoại hình).
* **Scene Prompting:** Khi render cảnh, chỉ mô tả hành động (Action) và truyền danh sách `character_names`. Veo nhận ảnh tham chiếu làm input để giữ mặt và trang phục nhân vật giống nhau 100% qua mọi phân cảnh.
* **Scene Chaining:** Dùng frame cuối của Scene trước làm frame đầu của Scene sau để tạo chuyển động máy quay mượt mà.

---

## 3. Ứng dụng trong hệ sinh thái Quang Quý AI
* **Thương mại / Dịch vụ:** Sản xuất video quảng cáo cho Thiện Thành Limousine, dịch vụ Spa, dự án Bất động sản.
* **Nội dung sáng tạo / Triết lý:** Chuyển thể các tác phẩm chiêm nghiệm nhân sinh (*"Hạt Bụi Ghé Qua"*, *"Duyên do trời định, phận do người tạo"*) thành video hoạt họa cinematic.
* **Định dạng:** Tối ưu hóa cả tỷ lệ 9:16 (Shorts/Reels/TikTok) và 16:9 (YouTube/TVC).

---

## 4. Kỹ năng điều khiển liên kết
* Skill tương ứng: `skills/flowkit-ai-filmmaker/SKILL.md`
