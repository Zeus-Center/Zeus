#!/usr/bin/env bash
# media-read.sh — giúp agent đọc nội dung PDF / ảnh / video trong workspace.
#
# QUAN TRỌNG:
#   Script này trích xuất **văn bản** (text layer, OCR, chữ trong khung hình).
#   Nó KHÔNG làm agent "nhìn thấy" hình ảnh. Để agent hiểu nội dung hình
#   (giao diện, ảnh chụp, khung hình video), cần dùng model có vision trong Arena.
#
# Dùng:
#   bash scripts/media-read.sh setup                    # cài toolchain (1 lần / phiên, ~1-2 phút)
#   bash scripts/media-read.sh pdf   <file.pdf>         # trích text; PDF scan -> tự OCR từng trang
#   bash scripts/media-read.sh image <file.png|jpg>     # OCR ảnh (screenshot lỗi, hóa đơn, code)
#   bash scripts/media-read.sh video <file.mp4> [giây]  # metadata + cắt frame + OCR chữ trong frame
#
# Ghi chú môi trường: apt/không dùng được (mạng bị chặn), mọi thứ cài qua pip:
#   pypdf, pymupdf (PDF + render trang), imageio-ffmpeg (ffmpeg binary),
#   rapidocr-onnxruntime + opencv-python-headless (OCR, có chữ Việt có dấu).
# Venv nằm ở /tmp/venv-media (không lưu vào repo); chạy `setup` lại mỗi phiên mới.

set -euo pipefail

VENV="/tmp/venv-media"
PY="$VENV/bin/python"
WORK="/tmp/media-read"

setup() {
  echo "== Tạo venv + cài toolchain qua pip =="
  [ -d "$VENV" ] || python3 -m venv "$VENV"
  "$PY" -m pip install -q --upgrade pip >/dev/null 2>&1 || true
  "$PY" -m pip install -q pypdf pymupdf imageio-ffmpeg \
    rapidocr-onnxruntime opencv-python-headless
  echo "Xong: $($PY -c 'import pymupdf,imageio_ffmpeg;print("pymupdf",pymupdf.__doc__.split()[1])')"
}

ensure() {
  if [ ! -x "$PY" ] || ! "$PY" -c "import pymupdf, rapidocr_onnxruntime, imageio_ffmpeg" >/dev/null 2>&1; then
    setup
  fi
  mkdir -p "$WORK"
}

case "${1:-}" in
  setup) setup ;;

  pdf)
    ensure
    "$PY" - "$2" <<'PYCODE'
import sys, os
import pymupdf
f = sys.argv[1]
if not os.path.isfile(f):
    sys.exit(f"Không thấy file: {f}")
d = pymupdf.open(f)
print(f"== PDF: {f} — {len(d)} trang — {os.path.getsize(f)/1024:.1f} KB ==")
text = "\n".join(p.get_text() for p in d)
if len(text.strip()) < 50:
    print("-- Text layer rỗng: đây là PDF scan, chạy OCR từng trang --")
    from rapidocr_onnxruntime import RapidOCR
    ocr = RapidOCR()
    os.makedirs("/tmp/media-read", exist_ok=True)
    for i, p in enumerate(d, 1):
        out = f"/tmp/media-read/pdf-{i:03d}.png"
        p.get_pixmap(dpi=200).save(out)
        print(f"---- trang {i} ----")
        res, _ = ocr(out)
        for r in (res or []):
            print(r[1])
else:
    print(text)
PYCODE
    ;;

  image)
    ensure
    "$PY" - "$2" <<'PYCODE'
import sys, os
f = sys.argv[1]
if not os.path.isfile(f):
    sys.exit(f"Không thấy file: {f}")
print(f"== OCR ảnh: {f} — {os.path.getsize(f)/1024:.1f} KB ==")
from rapidocr_onnxruntime import RapidOCR
res, _ = RapidOCR()(f)
if not res:
    print("(không tìm thấy chữ trong ảnh — nếu cần hiểu nội dung hình, hãy dùng model có vision)")
for r in res or []:
    print(r[1])
PYCODE
    ;;

  video)
    ensure
    "$PY" - "$2" "${3:-5}" <<'PYCODE'
import sys, os, glob, subprocess, shutil
import imageio_ffmpeg
f, every = sys.argv[1], int(sys.argv[2] or 5)
if not os.path.isfile(f):
    sys.exit(f"Không thấy file: {f}")
exe = imageio_ffmpeg.get_ffmpeg_exe()
out = "/tmp/media-read/video"
shutil.rmtree(out, ignore_errors=True); os.makedirs(out, exist_ok=True)

print(f"== Video: {f} — {os.path.getsize(f)/1024/1024:.1f} MB ==")
p = subprocess.run([exe, "-i", f], capture_output=True, text=True)
print("== Metadata ==")
for line in p.stderr.splitlines():
    if any(k in line for k in ("Duration", "Stream #", "Video:", "Audio:")):
        print(line.strip())

subprocess.run([exe, "-v", "error", "-i", f, "-vf", f"fps=1/{every}", "-q:v", "3",
                f"{out}/f-%04d.png"], check=False)
frames = sorted(glob.glob(f"{out}/f-*.png"))
print(f"\n== Đã cắt {len(frames)} frame (1 frame / {every}s) — OCR chữ trong khung ==")
from rapidocr_onnxruntime import RapidOCR
ocr = RapidOCR()
for i, img in enumerate(frames, 1):
    res, _ = ocr(img)
    lines = [r[1] for r in (res or [])]
    print(f"---- ~{(i-1)*every}s ----")
    print("\n".join(lines) if lines else "(không có chữ)")

a = subprocess.run([exe, "-v", "error", "-i", f, "-vn", "-ac", "1", "-ar", "16000",
                    f"{out}/audio.wav"], capture_output=True)
print("\n== Audio ==")
if os.path.exists(f"{out}/audio.wav"):
    print(f"Đã tách audio: {out}/audio.wav")
    print("Lưu ý: agent KHÔNG có speech-to-text offline. Cung cấp transcript (.srt/.vtt/.txt) để đọc lời thoại.")
else:
    print("Không có audio track.")
PYCODE
    ;;

  *) sed -n '2,20p' "$0" ;;
esac
