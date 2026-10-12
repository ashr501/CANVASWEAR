"""画素数ガイド用の見比べ画像を作る。
同じ絵を「元の大きさ」「縮小されたもの」「さらに小さいもの」にしてから同じ大きさに引き伸ばし、
画素数が足りないと印刷でどう見えるかを並べて見せる。"""
import math, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W = H = 1200
random.seed(7)
art = Image.new("RGB", (W, H), "#fdf6ec")
d = ImageDraw.Draw(art)
# 花柄（ハイビスカス風）
def flower(cx, cy, r, color, center):
    for k in range(5):
        a = k * 2 * math.pi / 5
        px, py = cx + r * 0.62 * math.cos(a), cy + r * 0.62 * math.sin(a)
        d.ellipse([px - r * 0.55, py - r * 0.55, px + r * 0.55, py + r * 0.55], fill=color)
    d.ellipse([cx - r * 0.25, cy - r * 0.25, cx + r * 0.25, cy + r * 0.25], fill=center)
    for k in range(5):
        a = k * 2 * math.pi / 5 + 0.6
        d.line([cx, cy, cx + r * 0.42 * math.cos(a), cy + r * 0.42 * math.sin(a)], fill="#5a2a2a", width=4)
for _ in range(9):
    x, y = random.randint(100, W - 100), random.randint(100, H - 100)
    d.ellipse([x - 140, y - 60, x + 140, y + 60], fill="#7fb77e")
    d.line([x - 130, y, x + 130, y], fill="#3f7a46", width=5)
for cx, cy, r, c in [(300, 320, 190, "#e8505b"), (870, 300, 160, "#f6a01a"), (620, 760, 220, "#d94f8c"),
                     (230, 930, 150, "#f6a01a"), (1010, 900, 170, "#e8505b")]:
    flower(cx, cy, r, c, "#ffd84d")
font = ImageFont.truetype("/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc", 120)
txt = "Aloha"
bb = d.textbbox((0, 0), txt, font=font)
tx, ty = (W - (bb[2] - bb[0])) // 2, 520
d.text((tx + 5, ty + 5), txt, font=font, fill="#ffffff")
d.text((tx, ty), txt, font=font, fill="#1f3b73")

PANEL = 700
def panel(src_px, nearest):
    small = art.resize((src_px, src_px), Image.LANCZOS)
    return small.resize((PANEL, PANEL), Image.NEAREST if nearest else Image.BICUBIC)
for name, px, nearest in [("good", 1200, False), ("blur", 110, False), ("jaggy", 60, True)]:
    panel(px, nearest).save(f"/Users/eclat/Projects/active/canvaswear/content/print-compare-{name}.jpg", quality=86)
print("ok")
