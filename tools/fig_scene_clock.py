#!/usr/bin/env python3
"""Draw source-backed scene order, not an invented or measured play clock.
Requires Pillow >= 10.1. Scene states mirror docs/GDD.md and local storyboard tables.
Run with the Python environment used by tools/render_gdd.sh.
"""
from pathlib import Path
import sys
try:
    from PIL import Image, ImageDraw, ImageFont, __version__
except ImportError:
    sys.exit("missing dependency: Pillow >= 10.1; select a Python environment with Pillow")
if tuple(int(part) for part in __version__.split('.')[:2]) < (10, 1):
    sys.exit("Pillow >= 10.1 required for sized fallback fonts")

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs/fig-scene-clock.png"
SCENES = [
    ("Title", "partial"), ("First loss", "partial"),
    ("Broken screen", "partial"), ("Wrong room", "partial"),
    ("Exploration", "partial"), ("Second match", "partial"),
    ("Return to work", "graybox"), ("Customer call", "graybox"),
    ("Message home", "tables"), ("One more game", "tables"),
    ("Longest night", "tables"), ("Fair fight", "tables"),
    ("Last reply", "partial"),
]
LABELS = {"partial": "Partial runtime counterpart", "graybox": "Graybox only", "tables": "Proposal tables only"}
COLORS = {"partial": "#176B70", "graybox": "#655493", "tables": "#96511D"}


def font(size, bold=False):
    name = "Arial Bold.ttf" if bold else "Arial.ttf"
    path = Path("/System/Library/Fonts/Supplemental") / name
    if path.exists():
        return ImageFont.truetype(str(path), size)
    # Pillow's bundled font avoids a platform-specific mandatory font dependency.
    return ImageFont.load_default(size=size)


def main():
    im = Image.new("RGB", (2000, 1430), "white")
    d = ImageDraw.Draw(im)
    d.text((65, 35), "The story is planned; the runtime covers parts", fill="#171717", font=font(52, True))
    d.text((65, 110), "Scene order, not elapsed play time or completion percentage", fill="#555555", font=font(34))
    for i, (name, state) in enumerate(SCENES):
        y = 190 + i * 77
        if i % 2 == 0:
            d.rectangle((55, y - 9, 1945, y + 64), fill="#F3F5F6")
        d.text((75, y), f"{i + 1:02d}", fill="#555555", font=font(36))
        d.text((195, y), name, fill="#171717", font=font(38, True))
        c = COLORS[state]
        if state == "partial":
            d.rectangle((850, y + 6, 884, y + 40), fill=c)
        elif state == "graybox":
            d.ellipse((850, y + 6, 884, y + 40), outline=c, width=5)
        else:
            d.polygon([(867, y + 5), (846, y + 41), (888, y + 41)], fill=c)
        d.text((925, y), LABELS[state], fill=c, font=font(36))
        if i in (5, 12):
            d.text((1595, y + 4), "3 s reply, planned", fill="#555555", font=font(29))
    d.text((65, 1230), "Partial does not mean the full scene is playable.", fill="#171717", font=font(34, True))
    d.text((65, 1290), "Evidence: main.gd; ACT3-TABLES.md (M2.6); ACT45-TABLES.md (E.1).", fill="#555555", font=font(29))
    d.text((65, 1340), "Planned reply timings are draft constraints, not player measurements.", fill="#555555", font=font(29))
    im.save(OUT, dpi=(300, 300), optimize=True)
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
