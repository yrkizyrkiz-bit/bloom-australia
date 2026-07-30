#!/usr/bin/env python3
"""Rebuild care-plan phone overlays from exact glass corners on care-plan-card.png."""

from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "public/images/care-plan-slider"
OUT = BASE / "slides"

# Exact marked inner-glass corners on 1672×941 care-plan-card.png
QUAD = np.float32(
    [
        [779, 132],
        [1024, 122],
        [1090, 681],
        [830, 700],
    ]
)

SLIDES = [
    ("app-01-goals.png", "slide-goals.png"),
    ("app-02-treatment.png", "slide-treatment.png"),
    ("app-03-planner.png", "slide-planner.png"),
    ("app-04-trends.png", "slide-trends.png"),
]


def cover_resize(img: np.ndarray, tw: int, th: int) -> np.ndarray:
    """object-fit: cover; object-position: top center"""
    ih, iw = img.shape[:2]
    scale = max(tw / iw, th / ih)
    nw, nh = int(round(iw * scale)), int(round(ih * scale))
    resized = cv2.resize(img, (nw, nh), interpolation=cv2.INTER_LINEAR)
    x0 = max(0, (nw - tw) // 2)
    return resized[0:th, x0 : x0 + tw]


def rounded_rect_mask(width: int, height: int, radius: int) -> np.ndarray:
    mask = np.zeros((height, width), np.uint8)
    r = max(1, int(radius))
    cv2.rectangle(mask, (r, 0), (width - r - 1, height - 1), 255, -1)
    cv2.rectangle(mask, (0, r), (width - 1, height - r - 1), 255, -1)
    for cx, cy in (
        (r, r),
        (width - r - 1, r),
        (r, height - r - 1),
        (width - r - 1, height - r - 1),
    ):
        cv2.circle(mask, (cx, cy), r, 255, -1)
    return mask


def main() -> None:
    card = cv2.imread(str(BASE / "care-plan-card.png"))
    if card is None:
        raise SystemExit(f"Missing {BASE / 'care-plan-card.png'}")
    h, w = card.shape[:2]
    if (w, h) != (1672, 941):
        raise SystemExit(f"Unexpected card size {w}×{h}, expected 1672×941")

    qw = float(
        (np.linalg.norm(QUAD[1] - QUAD[0]) + np.linalg.norm(QUAD[2] - QUAD[3]))
        / 2
    )
    qh = float(
        (np.linalg.norm(QUAD[3] - QUAD[0]) + np.linalg.norm(QUAD[2] - QUAD[1]))
        / 2
    )
    src_h = 1400
    src_w = max(2, int(round(src_h * (qw / qh))))

    OUT.mkdir(parents=True, exist_ok=True)

    for src_name, dst_name in SLIDES:
        slide = cv2.imread(str(BASE / src_name), cv2.IMREAD_COLOR)
        if slide is None:
            raise SystemExit(f"Missing {BASE / src_name}")
        covered = cover_resize(slide, src_w, src_h)
        src = np.float32(
            [[0, 0], [src_w - 1, 0], [src_w - 1, src_h - 1], [0, src_h - 1]]
        )
        matrix = cv2.getPerspectiveTransform(src, QUAD)
        warped = cv2.warpPerspective(covered, matrix, (w, h), flags=cv2.INTER_LINEAR)

        radius = max(36, int(min(src_w, src_h) * 0.06))
        src_mask = rounded_rect_mask(src_w, src_h, radius)
        warped_mask = cv2.warpPerspective(
            src_mask, matrix, (w, h), flags=cv2.INTER_LINEAR
        )
        soft = cv2.GaussianBlur(warped_mask, (3, 3), 0)
        soft = np.where(soft > 200, 255, soft).astype(np.uint8)

        cv2.imwrite(str(OUT / dst_name), np.dstack([warped, soft]))
        print(f"Wrote {OUT / dst_name}")


if __name__ == "__main__":
    main()
