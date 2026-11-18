"""Refine an existing RGBA cutout: optional upscale, smooth alpha, uniform white sticker outline."""
import sys
from PIL import Image, ImageFilter

src, dst, scale, outline = sys.argv[1], sys.argv[2], float(sys.argv[3]), int(sys.argv[4])
im = Image.open(src).convert("RGBA")
if scale != 1:
    im = im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS)
    im = im.filter(ImageFilter.UnsharpMask(radius=2, percent=50, threshold=2))
pad = outline * 3
canvas = Image.new("RGBA", (im.width + pad * 2, im.height + pad * 2), (0, 0, 0, 0))
canvas.paste(im, (pad, pad))
a = canvas.getchannel("A").filter(ImageFilter.GaussianBlur(1.5)).point(lambda v: 0 if v < 70 else (255 if v > 170 else int((v - 70) * 2.55)))
grown = a.filter(ImageFilter.MaxFilter(outline * 2 + 1)).filter(ImageFilter.GaussianBlur(1.6))
base = Image.new("RGBA", canvas.size, (255, 255, 255, 0))
base.putalpha(grown)
fg = canvas.copy()
fg.putalpha(a)
base.alpha_composite(fg)
base = base.crop(base.getbbox())
base.save(dst)
print(dst, base.size)
