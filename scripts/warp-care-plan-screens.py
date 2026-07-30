#!/usr/bin/env python3
"""Bake each app screen into a full opaque care-plan card (1672×941).

Snaps the bezel corner notes inward to dark-green glass chrome, warps
each app screenshot into that quad, then composites thumbs + Dynamic
Island from the photo on top.

  python3 scripts/warp-care-plan-screens.py
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SLIDER = ROOT / "public" / "images" / "care-plan-slider"
BAKED = SLIDER / "baked"

CARD_W, CARD_H = 1672, 941

# Outer marks from care-plan-card-phone-corners.txt (on bezel, not glass).
MARKED = np.array(
    [
        [779.0, 132.0],
        [1024.0, 122.0],
        [1090.0, 681.0],
        [830.0, 700.0],
    ],
    dtype=np.float64,
)

RADIUS = 0.06
SUPERSAMPLE = 2

SLIDES = [
    ("app-01-goals.png", "card-goals.jpg"),
    ("app-02-treatment.png", "card-treatment.jpg"),
    ("app-03-planner.png", "card-planner.jpg"),
    ("app-04-trends.png", "card-trends.jpg"),
]


def snap_corners(marked: np.ndarray, img: np.ndarray) -> np.ndarray:
    """Walk each mark toward the centroid until it hits glass chrome."""
    c = marked.mean(axis=0)
    out = []
    for p in marked:
        chosen = p + (c - p) * 0.08
        for t in np.linspace(0.02, 0.22, 60):
            q = p + (c - p) * t
            x, y = int(round(q[0])), int(round(q[1]))
            patch = img[max(0, y - 2) : y + 3, max(0, x - 2) : x + 3].astype(np.float64)
            if patch.size == 0:
                continue
            patch = patch.mean(axis=(0, 1))
            lum = patch.mean()
            r, g, b = patch
            if 5 < lum < 45 and g >= r - 2 and (r - b) < 25:
                chosen = q
                break
        out.append(chosen)
    return np.asarray(out, dtype=np.float64)


def homography(src: np.ndarray, dst: np.ndarray) -> np.ndarray:
    A = []
    for (x, y), (u, v) in zip(src, dst):
        A.append([-x, -y, -1, 0, 0, 0, u * x, u * y, u])
        A.append([0, 0, 0, -x, -y, -1, v * x, v * y, v])
    _, _, Vt = np.linalg.svd(np.asarray(A, dtype=np.float64))
    H = Vt[-1].reshape(3, 3)
    return H / H[2, 2]


def in_tri(p: np.ndarray, a: np.ndarray, b: np.ndarray, c: np.ndarray) -> np.ndarray:
    v0, v1, v2 = c - a, b - a, p - a
    den = v0[0] * v1[1] - v1[0] * v0[1]
    u = (v2[..., 0] * v1[1] - v1[0] * v2[..., 1]) / den
    v = (v0[0] * v2[..., 1] - v2[..., 0] * v0[1]) / den
    return (u >= -1e-4) & (v >= -1e-4) & (u + v <= 1 + 1e-4)


def warp_screen(src_img: Image.Image, dst_quad: np.ndarray, scale: int = SUPERSAMPLE) -> Image.Image:
    src_img = src_img.convert("RGBA")
    sw, sh = src_img.size
    src = src_img.resize((sw * scale, sh * scale), Image.Resampling.LANCZOS)
    ssw, ssh = src.size

    rm = Image.new("L", (ssw, ssh), 0)
    rad = int(min(ssw, ssh) * RADIUS)
    ImageDraw.Draw(rm).rounded_rectangle([0, 0, ssw - 1, ssh - 1], radius=rad, fill=255)
    rm = rm.filter(ImageFilter.GaussianBlur(scale * 0.8))
    sa = np.asarray(src, dtype=np.float64)
    sa[..., 3] *= np.asarray(rm).astype(np.float64) / 255.0

    dst = dst_quad * scale
    cw, ch = CARD_W * scale, CARD_H * scale
    src_quad = np.array([[0, 0], [ssw - 1, 0], [ssw - 1, ssh - 1], [0, ssh - 1]], dtype=np.float64)
    H_inv = homography(dst, src_quad)

    minx = max(0, int(np.floor(dst[:, 0].min())) - 2)
    maxx = min(cw - 1, int(np.ceil(dst[:, 0].max())) + 2)
    miny = max(0, int(np.floor(dst[:, 1].min())) - 2)
    maxy = min(ch - 1, int(np.ceil(dst[:, 1].max())) + 2)

    ys, xs = np.mgrid[miny : maxy + 1, minx : maxx + 1]
    mapped = H_inv @ np.stack(
        [xs.ravel().astype(np.float64), ys.ravel().astype(np.float64), np.ones(xs.size)],
        axis=0,
    )
    w = mapped[2].copy()
    w[np.abs(w) < 1e-12] = 1e-12
    sx = (mapped[0] / w).reshape(xs.shape)
    sy = (mapped[1] / w).reshape(ys.shape)

    p = np.stack([xs, ys], axis=-1).astype(np.float64)
    a, b, c, d = dst
    hard = in_tri(p, a, b, c) | in_tri(p, a, c, d)
    soft = (
        np.asarray(
            Image.fromarray(hard.astype(np.uint8) * 255).filter(
                ImageFilter.GaussianBlur(scale * 0.7)
            )
        ).astype(np.float64)
        / 255.0
    )

    x0 = np.floor(sx).astype(np.int32)
    y0 = np.floor(sy).astype(np.int32)
    wa = sx - x0
    wb = sy - y0
    valid = (soft > 0.001) & (sx >= 0) & (sy >= 0) & (sx <= ssw - 1) & (sy <= ssh - 1)
    x0c = np.clip(x0, 0, ssw - 1)
    x1c = np.clip(x0 + 1, 0, ssw - 1)
    y0c = np.clip(y0, 0, ssh - 1)
    y1c = np.clip(y0 + 1, 0, ssh - 1)

    def gather(xx: np.ndarray, yy: np.ndarray) -> np.ndarray:
        return sa[yy, xx]

    out = (
        gather(x0c, y0c) * ((1 - wa) * (1 - wb))[..., None]
        + gather(x1c, y0c) * (wa * (1 - wb))[..., None]
        + gather(x0c, y1c) * ((1 - wa) * wb)[..., None]
        + gather(x1c, y1c) * (wa * wb)[..., None]
    )
    out = np.clip(out, 0, 255)
    out[..., 3] *= soft
    out[~valid] = 0

    canvas = np.zeros((ch, cw, 4), dtype=np.uint8)
    canvas[miny : maxy + 1, minx : maxx + 1] = np.clip(out, 0, 255).astype(np.uint8)
    return Image.fromarray(canvas, "RGBA").resize((CARD_W, CARD_H), Image.Resampling.LANCZOS)


def island_alpha(orig_arr: np.ndarray) -> np.ndarray:
    lum = orig_arr[..., :3].mean(2)
    island_bin = (
        (lum < 14)
        & (np.arange(CARD_H)[:, None] >= 128)
        & (np.arange(CARD_H)[:, None] <= 168)
        & (np.arange(CARD_W)[None, :] >= 885)
        & (np.arange(CARD_W)[None, :] <= 995)
    )
    img = Image.fromarray(island_bin.astype(np.uint8) * 255)
    img = img.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.7))
    return np.asarray(img)


def hands_overlay(arr: np.ndarray) -> Image.Image:
    rgb = arr[..., :3].astype(np.float64)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    skin = (
        (r > 95)
        & (g > 60)
        & (b > 40)
        & (r >= g * 0.98)
        & (r > b)
        & ((r - b) > 18)
        & (rgb.mean(-1) > 70)
        & (rgb.mean(-1) < 220)
    )
    yy, xx = np.mgrid[0:CARD_H, 0:CARD_W]
    mask = skin & (yy > 630) & (yy < 760) & (xx > 770) & (xx < 1120)
    hm = Image.fromarray(mask.astype(np.uint8) * 255)
    hm = hm.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.7))
    return Image.fromarray(np.dstack([arr[..., :3], np.asarray(hm)]), "RGBA")


def main() -> None:
    BAKED.mkdir(parents=True, exist_ok=True)
    original_path = SLIDER / "care-plan-card.original.png"
    card_path = SLIDER / "care-plan-card.png"
    original = Image.open(original_path if original_path.exists() else card_path).convert("RGBA")
    arr = np.asarray(original).copy()

    glass = snap_corners(MARKED, arr[..., :3])
    print("glass:", glass.round(1).tolist())

    isle = island_alpha(arr)
    island_img = Image.fromarray(np.dstack([arr[..., :3], isle]), "RGBA")

    clear = Image.new("L", (CARD_W, CARD_H), 0)
    ImageDraw.Draw(clear).polygon([tuple(map(float, p)) for p in glass], fill=255)
    clear_arr = np.clip(
        np.asarray(clear).astype(np.int16) - isle.astype(np.int16),
        0,
        255,
    ).astype(np.uint8)
    clear = Image.fromarray(clear_arr).filter(ImageFilter.GaussianBlur(0.6))
    base = original.copy()
    base.paste(Image.new("RGBA", (CARD_W, CARD_H), (16, 28, 22, 255)), mask=clear)

    hands = hands_overlay(arr)

    for src_name, baked_name in SLIDES:
        screen = warp_screen(Image.open(SLIDER / src_name), glass)
        sa = np.array(screen)
        sa[..., 3] = (
            sa[..., 3].astype(np.float64) * (1.0 - isle.astype(np.float64) / 255.0)
        ).astype(np.uint8)
        out = Image.alpha_composite(base, Image.fromarray(sa, "RGBA"))
        out = Image.alpha_composite(out, island_img)
        out = Image.alpha_composite(out, hands)
        out.convert("RGB").save(BAKED / baked_name, quality=93, optimize=True)
        print(f"wrote {BAKED / baked_name}")

    Image.open(BAKED / "card-goals.jpg").save(card_path, quality=93)
    print(f"updated {card_path}")


if __name__ == "__main__":
    main()
