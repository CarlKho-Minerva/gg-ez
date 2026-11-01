#!/usr/bin/env python3
"""Draw the thirteen shipped chapters in order, with their card source and the measurements that exist.
Not a play clock: chapter order only. Requires Pillow >= 10.1 (sized fallback fonts, getlength).
Values mirror docs/GDD.md, web/src/campaign/*.json, web/verification/report.json and hosted-report.json
(2026-11-01). Run with the Python environment used by tools/render_gdd.sh.
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
# (name, kind, cards and source, measured)
SCENES = [
    ("Matchmaking", "title", "Campaign.ts, 1.01 to 1.09", ""),
    ("First match", "rigged", "fight('opening'); chat 2.07", "passive loss 30.8 s, 0 hits"),
    ("Rematch", "rigged", "early.json loss2, 5 cards", ""),
    ("The connection", "rigged", "early.json loss3, 19 cards", ""),
    ("The wrong room", "room", "early.json objects, 16 cards", "any 2 of 3 objects unlock"),
    ("Second match", "rigged", "act3.json m2, 10 cards", ""),
    ("The return", "room", "act3.json v2, 6 cards", ""),
    ("The call", "room", "act3.json c1, 13 cards", "4 caller lines"),
    ("Mama", "room", "final.json p9, 9 cards", ""),
    ("Mika", "room", "final.json k10, 6 cards", ""),
    ("The longest night", "room", "final.json t11, 6 cards", "4 time stamps"),
    ("A fair fight", "fair", "final.json f12, 8 cards", "win 10.3 s suite, 14.1 s hosted"),
    ("The last reply", "chat", "final.json e13, 11 cards", "silence 3,022 / 3,012 ms"),
]
KIND_LABEL = {
    "title": "Title and queue", "rigged": "Rigged fight", "room": "Room, observed",
    "fair": "Fair fight", "chat": "Chat, epilogue",
}
REPLY = {1, 5, 12}  # zero-based chapters that hold the three-second reply window
COLORS = {"title": "#555555", "rigged": "#96511D", "room": "#655493", "fair": "#176B70", "chat": "#555555"}
# Column x positions and the right edge each cell must stay inside.
COLS = {"num": (75, 140), "name": (150, 540), "kind": (620, 1020), "cards": (1040, 1450), "measured": (1470, 1960)}


def font(size, bold=False):
    name = "Arial Bold.ttf" if bold else "Arial.ttf"
    path = Path("/System/Library/Fonts/Supplemental") / name
    if path.exists():
        return ImageFont.truetype(str(path), size)
    return ImageFont.load_default(size=size)


def place(d, col, y, text, f, fill):
    """Draw text in a column and refuse to produce a figure whose text would overflow it."""
    x, right = COLS[col]
    width = f.getlength(text)
    if x + width > right:
        sys.exit(f"figure text overflows column {col}: {text!r} needs {width:.0f} px, has {right - x}")
    d.text((x, y), text, fill=fill, font=f)


def main():
    im = Image.new("RGB", (2000, 1430), "white")
    d = ImageDraw.Draw(im)
    d.text((65, 35), "Thirteen chapters, all in the shipped build", fill="#171717", font=font(52, True))
    d.text((65, 110), "Chapter order, not elapsed play time. Measured values: suite and hosted runs of 2026-11-01.",
           fill="#555555", font=font(34))
    head = font(29)
    for col, label in (("name", "Chapter"), ("kind", "Kind"), ("cards", "Cards and source"), ("measured", "Measured")):
        place(d, col, 168, label, head, "#555555")
    for i, (name, kind, cards, measured) in enumerate(SCENES):
        y = 215 + i * 74
        if i % 2 == 0:
            d.rectangle((55, y - 9, 1945, y + 61), fill="#F3F5F6")
        place(d, "num", y, f"{i + 1:02d}", font(36), "#555555")
        place(d, "name", y, name, font(38, True), "#171717")
        c = COLORS[kind]
        cx, cy = 577, y + 23
        if kind == "rigged":
            d.rectangle((cx - 17, cy - 17, cx + 17, cy + 17), fill=c)
        elif kind == "fair":
            d.polygon([(cx, cy - 21), (cx + 21, cy), (cx, cy + 21), (cx - 21, cy)], fill=c)
        elif kind == "room":
            d.ellipse((cx - 17, cy - 17, cx + 17, cy + 17), outline=c, width=5)
        else:
            d.rectangle((cx - 17, cy - 17, cx + 17, cy + 17), outline=c, width=5)
        label = KIND_LABEL[kind] + (", 3 s reply" if i in REPLY else "")
        place(d, "kind", y + 2, label, font(34), c)
        place(d, "cards", y + 5, cards, font(31), "#333333")
        if measured:
            place(d, "measured", y + 6, measured, font(29), "#171717")
    foot = font(29)
    d.text((65, 1215), "Square: rigged fight. Diamond: fair fight. Circle: room scene observed by the ghost.",
           fill="#171717", font=font(31, True))
    d.text((65, 1262), "Outlined square: title, or chat then epilogue. Every chapter runs in all six suite routes (107 beats each).",
           fill="#171717", font=foot)
    d.text((65, 1306), "Evidence: web/src/campaign/Campaign.ts, early.json, act3.json, final.json;", fill="#555555", font=foot)
    d.text((65, 1348), "web/verification/report.json and hosted-report.json; itch upload 20210294.", fill="#555555", font=foot)
    im.save(OUT, dpi=(300, 300), optimize=True)
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
