#!/usr/bin/env python3
"""Bake care-plan phone overlays from W1/W2/W3 full-card references.

Permanent fix:
  - care-plan-base.jpg  — W1 scene with glass (+ chin) cleared to dark
  - overlays/*.webp     — transparent screen layers clipped to true glass
  - Site stacks base + crossfades overlays (same 1672×941 → no drift)

W1–W3 ChatGPT bottoms run long / smear past the bezel. GLASS bottom is
raised and hard-clipped so overlays cannot spill onto hands/bezel.
Hands/hardware are restored from W1 without bringing W1 screen UI back.

  python3 scripts/bake-care-plan-overlays.py
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SLIDER = ROOT / "public" / "images" / "care-plan-slider"
MEM = ROOT / "public" / "images" / "membership"
SOURCES = SLIDER / "sources"
OUT = SLIDER / "overlays"

CARD_W, CARD_H = 1672, 941

# True inner glass. Bottom raised vs W* spill (~y 700–715).
GLASS = np.array(
    [
        [789.0, 149.0],
        [1021.0, 131.0],
        [1076.0, 648.0],
        [840.0, 665.0],
    ],
    dtype=np.float64,
)

W_SOURCES = [
    (("W1.png", "w1.png"), "W1.png", "overlay-01-treatment"),
    (("W2.png", "w2.png"), "W2.png", "overlay-02-planner"),
    (("W3.png", "w3.png"), "W3.png", "overlay-03-chat"),
]


def resolve_mem(candidates: tuple[str, ...]) -> Path:
    for name in candidates:
        path = MEM / name
        if path.exists():
            return path
    raise FileNotFoundError(f"Missing any of {candidates} in {MEM}")


def load_rgb(path: Path) -> np.ndarray:
    return np.asarray(Image.open(path).convert("RGB"), dtype=np.float64)


def bottom_keep_mask() -> np.ndarray:
    """1 above glass bottom edge, 0 at/below (feathered)."""
    keep = np.ones((CARD_H, CARD_W), dtype=np.float64)
    bl, br = GLASS[3], GLASS[2]
    for x in range(740, 1150):
        t = (x - bl[0]) / (br[0] - bl[0] + 1e-9)
        yb = bl[1] + t * (br[1] - bl[1])
        y0 = min(CARD_H - 1, max(0, int(np.floor(yb))))
        keep[y0:, x] = 0.0
    return (
        np.asarray(
            Image.fromarray((keep * 255).astype(np.uint8)).filter(
                ImageFilter.GaussianBlur(0.6)
            )
        ).astype(np.float64)
        / 255.0
    )


def island_alpha(rgb: np.ndarray) -> np.ndarray:
    lum = rgb.mean(-1)
    island = (
        (lum < 28)
        & (np.arange(CARD_H)[:, None] >= 125)
        & (np.arange(CARD_H)[:, None] <= 172)
        & (np.arange(CARD_W)[None, :] >= 885)
        & (np.arange(CARD_W)[None, :] <= 995)
    )
    return (
        np.asarray(
            Image.fromarray(island.astype(np.uint8) * 255)
            .filter(ImageFilter.MaxFilter(3))
            .filter(ImageFilter.GaussianBlur(0.5))
        ).astype(np.float64)
        / 255.0
    )


def hands_alpha(rgb: np.ndarray) -> np.ndarray:
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    lum = rgb.mean(-1)
    skin = (
        (r > 100)
        & (g > 60)
        & (b > 40)
        & (r >= g * 1.02)
        & (r > b + 20)
        & ((r - g) > 8)
        & (lum > 70)
        & (lum < 210)
    )
    hands = (
        skin
        & (np.arange(CARD_H)[:, None] > 600)
        & (np.arange(CARD_H)[:, None] < 760)
        & (
            ((np.arange(CARD_W)[None, :] > 760) & (np.arange(CARD_W)[None, :] < 860))
            | ((np.arange(CARD_W)[None, :] > 1000) & (np.arange(CARD_W)[None, :] < 1130))
        )
    )
    return (
        np.asarray(
            Image.fromarray(hands.astype(np.uint8) * 255)
            .filter(ImageFilter.MaxFilter(5))
            .filter(ImageFilter.GaussianBlur(0.8))
        ).astype(np.float64)
        / 255.0
    )


def save_overlay(rgb: np.ndarray, alpha: np.ndarray, stem: str) -> None:
    rgba = np.zeros((CARD_H, CARD_W, 4), dtype=np.uint8)
    rgba[..., :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    rgba[..., 3] = (np.clip(alpha, 0, 1) * 255).astype(np.uint8)
    Image.fromarray(rgba).save(OUT / f"{stem}.png", optimize=True)
    Image.fromarray(rgba).save(OUT / f"{stem}.webp", "WEBP", quality=90, method=6)
    print(f"wrote {stem}.webp ({(OUT / (stem + '.webp')).stat().st_size} bytes)")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    SOURCES.mkdir(parents=True, exist_ok=True)

    loaded: list[tuple[str, np.ndarray]] = []
    for candidates, local_name, stem in W_SOURCES:
        src = resolve_mem(candidates)
        Image.open(src).save(SOURCES / local_name)
        loaded.append((stem, load_rgb(SOURCES / local_name)))

    w1 = loaded[0][1]
    glass_img = Image.new("L", (CARD_W, CARD_H), 0)
    ImageDraw.Draw(glass_img).polygon([tuple(p) for p in GLASS], fill=255)
    glass_hard = np.asarray(glass_img).astype(np.float64) / 255.0
    glass_soft = (
        np.asarray(glass_img.filter(ImageFilter.GaussianBlur(0.9))).astype(np.float64)
        / 255.0
    )
    bottom_keep = bottom_keep_mask()
    island_a = island_alpha(w1)
    hands_a = hands_alpha(w1)

    dark = np.array([16.0, 26.0, 22.0])
    base = w1.copy()
    clear = np.maximum(glass_hard, 1.0 - bottom_keep)
    base = base * (1 - clear[..., None]) + dark * clear[..., None]
    base = base * (1 - island_a[..., None]) + w1 * island_a[..., None]
    base = base * (1 - hands_a[..., None]) + w1 * hands_a[..., None]

    lum1 = w1.mean(-1)
    r, g, b = w1[..., 0], w1[..., 1], w1[..., 2]
    skin = (
        (r > 100)
        & (g > 60)
        & (b > 40)
        & (r >= g * 1.02)
        & (r > b + 20)
        & ((r - g) > 8)
        & (lum1 > 70)
        & (lum1 < 210)
    )
    chin = bottom_keep < 0.5
    hardware = chin & ((lum1 < 55) | skin)
    hardware_a = (
        np.asarray(
            Image.fromarray(hardware.astype(np.uint8) * 255).filter(
                ImageFilter.GaussianBlur(0.6)
            )
        ).astype(np.float64)
        / 255.0
    )
    base = base * (1 - hardware_a[..., None]) + w1 * hardware_a[..., None]

    base_u8 = np.clip(base, 0, 255).astype(np.uint8)
    Image.fromarray(base_u8).save(SLIDER / "care-plan-base.jpg", quality=93, optimize=True)
    Image.fromarray(base_u8).save(SLIDER / "care-plan-card.png", quality=93)

    hands_on_glass = hands_a * glass_soft
    overlay_a = np.clip(
        glass_soft * bottom_keep * (1 - island_a) * (1 - hands_on_glass * 0.98),
        0,
        1,
    )
    overlay_a = np.clip(overlay_a * 1.08, 0, 1)

    Image.fromarray((overlay_a * 255).astype(np.uint8)).save(OUT / "overlay-alpha.png")
    np.save(OUT / "glass-quad.npy", GLASS)

    for stem, rgb in loaded:
        save_overlay(rgb, overlay_a, stem)

    ys, xs = np.where(overlay_a > 0.5)
    print(
        "overlay bbox",
        int(xs.min()),
        int(ys.min()),
        int(xs.max()),
        int(ys.max()),
    )
    print(f"base → {SLIDER / 'care-plan-base.jpg'}")
    print("done")


if __name__ == "__main__":
    main()
