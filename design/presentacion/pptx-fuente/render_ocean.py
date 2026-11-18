"""Render the Pixie ocean shader to PNG frames with numpy (CPU port of pixie-ocean.glsl)."""
import sys, pathlib
import numpy as np
from PIL import Image

mode, outdir, W, H, frames, fps = sys.argv[1], pathlib.Path(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5]), float(sys.argv[6])
outdir.mkdir(parents=True, exist_ok=True)

def hexc(h):
    return np.array([int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)])

LIGHT = hexc("#94C2DE") if mode == "surface" else hexc("#C2D9E7")
SHADOW, LINE, DEEP, ABYSS = hexc("#5A8FB5"), np.ones(3), hexc("#16587B"), hexc("#0B3A55")
if mode != "surface":
    SHADOW = hexc("#84B3CE")

S = W / 1920.0
ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
fy = (H - 1 - ys)
px_x, px_y = xs / S, fy / S
uv_y = fy / H


def fract(a):
    return a - np.floor(a)


def hash1(x, y):
    return fract(np.sin(x * 41.3 + y * 289.1) * 43758.5453)


def hash2(x, y):
    return (fract(np.sin(x * 127.1 + y * 311.7) * 43758.5453), fract(np.sin(x * 269.5 + y * 183.3) * 43758.5453))


def vnoise(x, y):
    ix, iy = np.floor(x), np.floor(y)
    fx, fy_ = x - ix, y - iy
    fx = fx * fx * (3 - 2 * fx)
    fy_ = fy_ * fy_ * (3 - 2 * fy_)
    a, b = hash1(ix, iy), hash1(ix + 1, iy)
    c, d = hash1(ix, iy + 1), hash1(ix + 1, iy + 1)
    return (a + (b - a) * fx) + ((c + (d - c) * fx) - (a + (b - a) * fx)) * fy_


def cell_edge(x, y, t):
    nx, ny = np.floor(x), np.floor(y)
    fx, fy_ = x - nx, y - ny
    f1 = np.full(x.shape, 8.0, np.float32)
    f2 = np.full(x.shape, 8.0, np.float32)
    for j in (-1, 0, 1):
        for i in (-1, 0, 1):
            hx, hy = hash2(nx + i, ny + j)
            ox = 0.5 + 0.35 * np.sin(t + 6.2831 * hx)
            oy = 0.5 + 0.35 * np.sin(t + 6.2831 * hy)
            d = np.hypot(i + ox - fx, j + oy - fy_)
            closer = d < f1
            f2 = np.where(closer, f1, np.minimum(f2, d))
            f1 = np.where(closer, d, f1)
    return f2 - f1


def network(x, y, t, m):
    qx = vnoise(x * 0.9 + t * 0.15, y * 0.9)
    qy = vnoise(x * 0.9 + 5.2, y * 0.9 + t * 0.12)
    rx = vnoise(x * 2.1 + qx * 2 + 1.7, y * 2.1 + qy * 2 + t * 0.2)
    ry = vnoise(x * 2.1 + qx * 2 + 8.3, y * 2.1 + qy * 2 - t * 0.18)
    wx = x + (qx - 0.5) * 0.9 + (rx - 0.5) * 0.35
    wy = y + (qy - 0.5) * 0.9 + (ry - 0.5) * 0.35
    e = cell_edge(wx, wy, t * 0.5)
    th = (0.065 + 0.05 * vnoise(wx * 1.5 + t * 0.3, wy * 1.5 + t * 0.3)) * m
    return 1 - np.clip((e - th) / 0.012, 0, 1)


def smooth(a, b, x):
    tt = np.clip((x - a) / (b - a), 0, 1)
    return tt * tt * (3 - 2 * tt)


def ring(fx, fy_, cx, cy, r, w):
    d = np.abs(np.hypot(fx - cx, fy_ - cy) - r)
    return 1 - smooth(w, w * 1.8, d)


def mix(a, b, k):
    return a + (b - a) * k[..., None]


for f in range(frames):
    t = f / fps
    if mode == "surface":
        A, B = 0.0, 0.3
    elif mode == "descent":
        p = f / (frames - 1)
        A = 0.6 * (0.5 - 0.5 * np.cos(np.pi * p))
        B = A + 0.45
    else:
        A, B = 0.5, 1.0
    d = A + (B - A) * (1 - uv_y)
    col = np.broadcast_to(LIGHT, (H, W, 3)).astype(np.float32)
    col = mix(col, DEEP, smooth(0.40, 0.47, d))
    col = mix(col, ABYSS, smooth(0.68, 1.0, d))
    ca = 1 - smooth(0.38, 0.46, d)
    x, y = px_x / 150.0, px_y / 150.0
    if ca.max() > 0.001:
        sh = network(x + 0.16, y + 0.13, t, 2.1)
        ln = network(x, y, t, 1.0)
        shc = SHADOW + (DEEP - SHADOW) * 0.18
        col = mix(col, shc, sh * (1 - ln) * ca)
        col = mix(col, LINE, ln * ca)
        idx, idy = np.floor(x), np.floor(y)
        sel = hash1(idx, idy) > 0.55
        cx, cy = hash2(idx + 3.1, idy + 3.1)
        r = 0.05 + 0.05 * hash1(idx + 7, idy + 7)
        rr = ring(x - idx - 0.5, y - idy - 0.5, (cx - 0.5) * 0.5, (cy - 0.5) * 0.5, r, 0.012)
        col = mix(col, LINE, rr * sel * ca * 0.9)
    rz = smooth(0.42, 0.55, d) * (1 - smooth(0.8, 0.95, d))
    a = px_x / 220.0 + px_y / 900.0
    ry = 0.5 + 0.5 * np.sin(a * 3 + t * 0.25) * np.sin(a * 1.7 - t * 0.17 + 1.3)
    col = mix(col, LINE, smooth(0.55, 1.0, ry) * rz * 0.1)
    bz = smooth(0.42, 0.55, d)
    for k in (0, 1):
        qx = px_x / (70.0 + k * 45.0)
        qy = px_y / (70.0 + k * 45.0) - t * (0.35 + k * 0.2)
        qx = qx + 0.25 * np.sin(qy * 1.3 + k * 4.0)
        idx, idy = np.floor(qx), np.floor(qy)
        fx, fy_ = qx - idx - 0.5, qy - idy - 0.5
        sel = hash1(idx + k * 17, idy + k * 17) > 0.72
        hx, hy = hash2(idx + k, idy + k)
        cx, cy = (hx - 0.5) * 0.5, (hy - 0.5) * 0.5
        r = 0.07 + 0.1 * hash1(idx + 5 + k, idy + 5 + k)
        b = ring(fx, fy_, cx, cy, r, 0.03)
        dd = 1 - smooth(r * 0.25, r * 0.35, np.hypot(fx - cx + 0.35 * r, fy_ - cy - 0.35 * r))
        col = mix(col, LINE, (b * 0.65 + dd * 0.8) * sel * bz)
    sz = smooth(0.6, 0.9, d)
    qx = px_x / 26.0
    qy = px_y / 26.0 + t * 0.25
    qx = qx + 0.3 * np.sin(qy * 0.4 + t * 0.2)
    idx, idy = np.floor(qx), np.floor(qy)
    hh = hash1(idx + 9, idy + 9)
    hx, hy = hash2(idx, idy)
    s = (1 - smooth(0.03, 0.07, np.hypot(qx - idx - 0.5 - (hx - 0.5) * 0.6, qy - idy - 0.5 - (hy - 0.5) * 0.6))) * (hh > 0.9)
    col = mix(col, LINE, s * (0.6 + 0.4 * np.sin(t * 2 + hh * 30)) * sz * 0.55)
    img = (np.clip(col, 0, 1) * 255).astype(np.uint8)
    Image.fromarray(img).save(outdir / f"f{f:04d}.png")
print("done", mode, frames)
