---
name: flowkit-ai-filmmaker
description: Automated AI filmmaking and video production pipeline using Google Flow / Veo, Gemini AI planning, reference image consistency, TTS narration, and FFmpeg post-processing.
license: MIT-compatible synthesized workflow
---

# FlowKit AI Filmmaker Skill

## 1. Mission & Overview
Act as the AI Film Director and Automated Video Pipeline Engineer for **Quang Quý AI / Zeus**.
This skill automates end-to-end video creation (from story concept to finished, narrated, subtitled, multi-scene video) leveraging **Google Flow (Veo / VideoFX)**, **Gemini AI**, and **FFmpeg**.

---

## 2. Core Architecture & Mental Model

```text
1. Ý tưởng / Kịch bản (Story Concept)
        │
        ▼  [Gemini AI Planning]
2. Phân tách Thực thể (Entities: Characters, Locations, Props)
        │  └── Tạo ảnh tham chiếu (Reference Images) để giữ NHẤT QUÁN 100%
        ▼
3. Phân cảnh hành động (Scene Prompts & Camera Motions)
        │  └── Scene 1 (8s) ──▶ Scene 2 (8s) ──▶ Scene 3 (8s)
        ▼  [Chrome Extension / Google Flow Veo Bridge]
4. Render Video Clips + Gemini TTS (Lồng tiếng) + Whisper Subtitles (SRT)
        │
        ▼  [FFmpeg Engine]
5. Ghép Video hoàn chỉnh + Nhạc nền (Ducked Music) + Phụ đề + Xuất bản (16:9 hoặc 9:16)
```

---

## 3. Quy Tắc Vàng Trong Prompting (FlowKit Blueprint)

### A. Quy tắc Thực thể (Entity / Reference Rule)
* **Chỉ mô tả ngoại hình (Appearance ONLY)** trong mô tả nhân vật/đạo cụ để tạo ảnh tham chiếu:
  * *Đúng:* `An elegant businesswoman, late 20s, wearing a tailored navy blazer and minimalist pearl earrings, neat bun hairstyle, warm confident smile.`
  * *Sai:* `She is walking into a luxury spa and talking to a client.` (Không đưa hành động vào entity).

### B. Quy tắc Phân cảnh (Scene Action Rule)
* **Mô tả hành động (Action ONLY) & gọi tên thực thể:**
  * *Đúng:* `[Character_A] walks slowly towards the reception desk of [Spa_Lobby], smiling warmly and handing a brochure to [Client_B]. Camera dolly-in, cinematic lighting.`
  * *Sai:* Lặp lại toàn bộ mô tả ngoại hình của nhân vật trong scene prompt.

### C. Quy tắc Nối cảnh (Scene Chaining & Continuity)
* Lấy **frame cuối của Scene N** làm **frame đầu của Scene N+1** (`/fk-gen-chain-videos`) để đảm bảo chuyển cảnh liền mạch, không giật cục.

---

## 4. Các Lệnh Điều Khiển Chuẩn (Agent Workflows / Skills)

| Lệnh | Chức năng |
| :--- | :--- |
| `/fk-create-project "<Tên dự án>"` | Khởi tạo dự án video mới trong SQLite DB |
| `/fk-plan-story` | Dùng Gemini lên kịch bản, chia nhân vật, bối cảnh và lời thoại |
| `/fk-gen-references` | Sinh toàn bộ ảnh tham chiếu cho nhân vật, địa điểm, đạo cụ |
| `/fk-gen-scenes` | Sinh ảnh khung đầu tiên cho từng phân cảnh từ ảnh tham chiếu |
| `/fk-gen-chain-videos` | Render các clip 8s liên kết khung hình qua Google Flow / Veo |
| `/fk-gen-tts` | Tạo giọng đọc thuyết minh qua Gemini TTS + xuất word timings |
| `/fk-pipeline` | Chạy tự động toàn bộ quy trình từ kịch bản tới video cuối cùng |
| `/fk-creative-mix` | Tự động phân tích kịch bản để gợi ý góc cận, góc rộng, cutaway |
| `/fk-export-video` | Dùng FFmpeg ghép video, lồng nhạc nền, chèn phụ đề theo tỷ lệ 16:9 hoặc 9:16 |

---

## 5. Mẫu Cấu Trúc Dữ Liệu Phân Cảnh (JSON Schema cho Gemini)

```json
{
  "project_name": "Thiện Thành Limousine - Trải Nghiệm Thượng Lưu",
  "orientation": "portrait", // "portrait" (9:16) hoặc "landscape" (16:9)
  "entities": [
    {
      "name": "Businessman_Nam",
      "type": "character",
      "description": "Vietnamese businessman, early 30s, sharp modern suit, neat haircut, holding a leather briefcase."
    },
    {
      "name": "Luxury_Cabin",
      "type": "location",
      "description": "Ultra-luxury limousine interior, plush leather massage seats, ambient starlight LED ceiling, warm golden lighting."
    }
  ],
  "scenes": [
    {
      "scene_index": 1,
      "character_names": ["Businessman_Nam", "Luxury_Cabin"],
      "action_prompt": "[Businessman_Nam] relaxes on the massage chair inside [Luxury_Cabin], looking out the window while holding a cup of tea. Slow smooth pan left, cinematic bokeh.",
      "narration": "Mỗi chuyến đi không chỉ là di chuyển, mà là không gian tái tạo năng lượng hoàn hảo.",
      "duration_seconds": 8
    }
  ],
  "music_style": "Ambient cinematic piano, relaxing and premium"
}
```

---

## 6. Ứng Dụng Thực Chiến Cho Hệ Sinh Thái Quang Quý AI

1. **Video Marketing BĐS / Spa / Du lịch:**
   * Tạo video review căn hộ mẫu, quy trình chăm sóc da Spa chuẩn 5 sao với dàn nhân vật AI nhất quán.
2. **Video Kể chuyện Thương hiệu & Triết lý Nhân sinh:**
   * Biến các truyện ngắn (*"Duyên do trời định, phận do người tạo"*, *"Hạt Bụi Ghé Qua"*) thành các thước phim hoạt hình 3D/Cinematic giàu cảm xúc.
3. **Kênh Video Ngắn Tự Động (TikTok / Reels / YouTube Shorts):**
   * Sản xuất hàng loạt video ngắn có phụ đề động, giọng đọc AI truyền cảm hứng với chi phí tối ưu.
