# 產生 PWA 圖示（朱紅方塊＋四根聲紋長條），python tools/make_icons.py
from PIL import Image, ImageDraw
import os
OUT = os.path.join(os.path.dirname(__file__), '..', 'icons')
def icon(size, pad=0.0):
    s = 4 * size
    im = Image.new('RGBA', (s, s), (27, 26, 23, 255))
    d = ImageDraw.Draw(im)
    k = s * (1 - 2 * pad) / 512; o = s * pad
    d.rectangle([o + 56*k, o + 56*k, o + 456*k, o + 456*k], fill=(226, 67, 42, 255))
    bars = [(110, 300), (190, 200), (270, 120), (350, 250)]
    for x, top in bars:
        d.rectangle([o + x*k, o + top*k, o + (x + 52)*k, o + 400*k], fill=(243, 238, 228, 255))
    return im.resize((size, size), Image.LANCZOS)
icon(192).save(os.path.join(OUT, 'icon-192.png'))
icon(512).save(os.path.join(OUT, 'icon-512.png'))
icon(512, pad=0.1).save(os.path.join(OUT, 'icon-maskable-512.png'))
icon(180).convert('RGB').save(os.path.join(OUT, 'apple-touch-icon.png'))
print('ok')
