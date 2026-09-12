#!/usr/bin/env python3
"""Quita fondos claros de logos JPG y exporta PNG con alpha."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageFile

ImageFile.LOAD_TRUNCATED_IMAGES = True

ROOT = Path(__file__).resolve().parents[1] / "public/clientes/evento/34-sunset-pilates/images/sponsors"


def has_meaningful_alpha(im: Image.Image) -> bool:
    if im.mode != "RGBA":
        return False
    alpha = im.split()[-1]
    extrema = alpha.getextrema()
    return extrema[0] < 250


def to_transparent_png(src: Path, dst: Path, threshold: int = 238) -> None:
    im = Image.open(src)
    if im.mode == "RGBA" and has_meaningful_alpha(im):
        im.save(dst, "PNG")
        return
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r >= threshold and g >= threshold and b >= threshold:
                px[x, y] = (r, g, b, 0)
    im.save(dst, "PNG")


def main() -> None:
    jobs = [
        ("1.jpg", "1.png", 238),
        ("2.jpg", "2.png", 238),
        # 3.png: logo Capsule — no procesar (usar archivo original del cliente)
        ("4.jpeg", "4.png", 238),
        ("bodyfit.jpeg", "bodyfit.png", 235),
        ("palenque.jpeg", "palenque.png", 235),
    ]
    for src_name, out_name, th in jobs:
        src = ROOT / src_name
        dst = ROOT / out_name
        if not src.exists():
            print("skip missing", src)
            continue
        to_transparent_png(src, dst, th)
        print("ok", dst.name)


if __name__ == "__main__":
    main()
