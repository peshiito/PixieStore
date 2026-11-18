"""Compose the deck into an MP4 for phones: slide foregrounds over ocean/scroll videos, crossfades."""
import subprocess, sys, pathlib
import numpy as np
from PIL import Image

W = pathlib.Path(sys.argv[1])
out = sys.argv[2]
seg = W / "seg"
seg.mkdir(exist_ok=True)
FPS = 30
XF = 0.7


def matte(n):
    b = np.asarray(Image.open(W / "fg000000" / f"s-{n:02d}.png").convert("RGB"), dtype=np.float32) / 255
    w = np.asarray(Image.open(W / "fgFFFFFF" / f"s-{n:02d}.png").convert("RGB"), dtype=np.float32) / 255
    a = np.clip(1 - (w - b).mean(axis=2), 0, 1)
    c = np.where(a[..., None] > 0.004, b / np.maximum(a[..., None], 1e-4), 0)
    rgba = np.dstack([np.clip(c, 0, 1), a])
    p = W / "seg" / f"fg-{n:02d}.png"
    Image.fromarray((rgba * 255).astype(np.uint8), "RGBA").save(p)
    return p


def run(args):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *args], check=True)


slides = {
    1: ("bg", "ocean-surface.mp4", 9),
    4: ("bg", "ocean-descent.mp4", 12),
    11: ("bg", "ocean-deep.mp4", 8),
    5: ("inset", ("phone-m1.mp4", 137, 72, 475, 936), 12),
    8: ("inset", ("browser-d1.mp4", 108, 166, 1051, 662), 12),
}
enc = ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", str(FPS), "-crf", "20"]
durs = []
for n in range(1, 12):
    kind, src, dur = slides.get(n, ("still", None, 6))
    o = seg / f"s{n:02d}.mp4"
    if kind == "bg":
        fg = matte(n)
        run(["-stream_loop", "-1", "-i", str(W / src), "-loop", "1", "-i", str(fg), "-filter_complex",
             "[0]scale=1920:1080:flags=lanczos,setsar=1[b];[b][1]overlay=0:0:format=auto,format=yuv420p", "-t", str(dur), *enc, str(o)])
    elif kind == "inset":
        f, x, y, w, h = src
        run(["-loop", "1", "-i", str(W / "fg000000" / f"s-{n:02d}.png"), "-stream_loop", "-1", "-i", str(W / f), "-filter_complex",
             f"[0]scale=1920:1080,setsar=1[b];[1]scale={w}:{h}:flags=lanczos[v];[b][v]overlay={x}:{y},format=yuv420p", "-t", str(dur), *enc, str(o)])
    else:
        run(["-loop", "1", "-i", str(W / "fg000000" / f"s-{n:02d}.png"), "-vf", "scale=1920:1080,setsar=1,format=yuv420p", "-t", str(dur), *enc, str(o)])
    durs.append(dur)

inputs, chain = [], ""
for n in range(1, 12):
    inputs += ["-i", str(seg / f"s{n:02d}.mp4")]
prev, t = "[0:v]", 0.0
for i in range(1, 11):
    t += durs[i - 1] - XF
    lab = f"[x{i}]"
    chain += f"{prev}[{i}:v]xfade=transition=fade:duration={XF}:offset={t:.2f}{lab};"
    prev = lab
chain = chain.rstrip(";")
run([*inputs, "-filter_complex", chain, "-map", prev, *enc, "-movflags", "+faststart", out])
print("video ->", out, sum(durs) - XF * 10, "s")
