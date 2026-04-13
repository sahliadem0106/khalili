from PIL import Image
import numpy as np

# ── Load ──────────────────────────────────────────────────────────────────────
img = Image.open(r"C:\Users\sahli\Desktop\LOGO 2_upscayl_5x_upscayl-standard-4x.png").convert("RGB")
arr = np.array(img, dtype=np.float32)   # (H, W, 3)  float for smooth maths

# ── Anchor colours (as floats) ────────────────────────────────────────────────
BG_COLOR   = np.array([239.0, 240.0, 239.0])   # original light-grey background
LOGO_GREEN = np.array([ 26.0,  57.0,  52.0])   # dark-green ink (D letter)
LOGO_GOLD  = np.array([192.0, 148.0,  98.0])   # golden accent

NEW_BG     = np.array([  2.0,  44.0,  34.0])   # #022c22 – new background
NEW_GREEN  = np.array([255.0, 255.0, 255.0])   # white  – replaces dark-green ink
# GOLD stays unchanged

# ── Check actual colors in image ────────────────────────────────────────────
print("Unique colors in image (top 20):")
unique_colors = {}
for pixel in arr.reshape(-1, 3):
    color_tuple = tuple(pixel)
    unique_colors[color_tuple] = unique_colors.get(color_tuple, 0) + 1

for color, count in sorted(unique_colors.items(), key=lambda x: -x[1])[:20]:
    print(f"  RGB{color} - appears {count} times")

# ── Direct color replacement ────────────────────────────────────────────────
out = arr.copy()

# Replace background: (239, 240, 239) → (2, 44, 34)
mask_bg = np.all(np.abs(out - BG_COLOR) < 20, axis=2)
out[mask_bg] = NEW_BG

# Replace green: (26, 57, 52) → (255, 255, 255)
mask_green = np.all(np.abs(out - LOGO_GREEN) < 20, axis=2)
out[mask_green] = NEW_GREEN

out = np.clip(out, 0, 255).astype(np.uint8)

# ── Save at full resolution, max quality, lossless PNG ───────────────────────
result = Image.fromarray(out, "RGB")
result.save(r"C:\Users\sahli\Desktop\logo_final.png", optimize=False, compress_level=1)
print(f"Done  →  {result.size[0]} × {result.size[1]} px")
