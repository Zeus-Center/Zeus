# ⚡ Zeus AI Keyboard

**Bàn phím AI thông minh cho Android — Hỗ trợ tiếng Việt & tích hợp AI.**

<p align="center">
  <strong>GỌI BẤT KỲ AI NÀO KHI CẦN NGAY TRÊN BÀN PHÍM ĐIỆN THOẠI</strong>
</p>

---

## ✨ Tính năng

### 🇻🇳 Gõ tiếng Việt kiểu Telex
- `aa` → `â`, `oo` → `ô`, `ee` → `ê`
- `dd` → `đ`
- `uw` → `ư`, `ow` → `ơ`, `aw` → `ă`
- `s` → sắc, `f` → huyền, `r` → hỏi, `x` → ngã, `j` → nặng

### ⚡ AI Assistant
- Nhấn nút **⚡AI** trên bàn phím để gọi AI
- Gợi ý hoàn thành câu thông minh
- Hỗ trợ cả tiếng Việt và English
- Tương thích OpenRouter, OpenAI, và Hermes Gateway

### 🎨 Giao diện
- Theme tối hiện đại (Dark Navy)
- Thiết kế Material Design
- Biểu tượng Adaptive Icon
- Hỗ trợ 2 ngôn ngữ: Tiếng Việt & English

---

## 📥 Tải & Cài đặt

### Cách 1: Tải từ GitHub Actions (Recommended)
1. Vào tab **Actions** → **Build Zeus AI Keyboard APK**
2. Chọn workflow run mới nhất
3. Tải file `ZeusAIKeyboard-debug` hoặc `ZeusAIKeyboard-release`
4. Cài file APK trên điện thoại

### Cách 2: Build từ source
```bash
cd android-keyboard
./gradlew assembleDebug
# APK: app/build/outputs/apk/debug/app-debug.apk
```

### Sau khi cài APK:
1. Mở app **Zeus AI Keyboard**
2. Nhấn **"Bật Zeus AI Keyboard"** → Gạt công tắc bật
3. Nhấn **"Chọn Zeus AI Keyboard"** → Chọn làm bàn phím mặc định
4. Quay lại bất kỳ app nào và bắt đầu gõ!

---

## ⚙️ Cấu hình AI

1. Mở app **Zeus AI Keyboard**
2. Nhập API Key (lấy từ [OpenRouter](https://openrouter.ai/keys))
3. Chọn model AI (mặc định: `openai/gpt-4o-mini`)
4. Nhấn **💾 Lưu cài đặt**
5. Nhấn nút ⚡AI trên bàn phím để dùng

> 💡 **Mẹo:** Dùng OpenRouter để truy cập GPT-4o-mini miễn phí hoặc giá rẻ.

---

## 🏗️ Kiến trúc

```
android-keyboard/
├── app/src/main/
│   ├── java/com/zeus/keyboard/
│   │   ├── ZeusKeyboardService.java    # Input Method Service chính
│   │   ├── ai/
│   │   │   └── ZeusAIAssistant.java    # Kết nối AI (OpenRouter/OpenAI)
│   │   └── ui/
│   │       ├── SettingsActivity.java   # Màn hình cài đặt
│   │       └── VietnameseProcessor.java # Xử lý gõ Telex
│   ├── res/
│   │   ├── xml/
│   │   │   ├── keyboard_main.xml       # Bố cục bàn phím QWERTY
│   │   │   ├── keyboard_symbols.xml    # Bố cục ký tự đặc biệt
│   │   │   └── method.xml             # Khai báo input method
│   │   ├── layout/
│   │   │   └── activity_settings.xml   # Layout cài đặt
│   │   ├── drawable/                   # Vector icons
│   │   ├── mipmap-*/                   # Launcher icon
│   │   └── values/                     # Strings, colors, themes
│   └── AndroidManifest.xml
├── build.gradle
└── settings.gradle
```

---

## 📱 Yêu cầu

- Android 7.0 (API 24) trở lên
- Dung lượng: ~5MB
- Quyền: Internet (cho AI), Vibrate (phản hồi gõ)

---

## 🔄 Roadmap

- [ ] Gợi ý từ thông minh (word-level suggestions)
- [ ] Auto-correct tiếng Việt
- [ ] Gõ VNI (song song Telex)
- [ ] Clipboard history
- [ ] Theme tùy chỉnh
- [ ] Sticker & emoji suggestions
- [ ] Voice-to-text
- [ ] Tích hợp Hermes Gateway trực tiếp

---

## 📄 License

© 2026 Nguyễn Quang Quý • ZeusopenAI
