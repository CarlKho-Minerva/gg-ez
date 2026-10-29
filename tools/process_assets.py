# Cut generated art out of its background and size it for the game.
#   python3 tools/process_assets.py <raw_dir>
# Background = everything connected to the image border whose colour is close to the border's
# median colour (the generator paints a flat-ish magenta or white backdrop).
import sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

RAW = Path(sys.argv[1])
OUT = Path(__file__).resolve().parent.parent / "assets"


def cutout(path: Path, tol: float) -> Image.Image:
    im = np.asarray(Image.open(path).convert("RGB")).astype(np.float32)
    border = np.concatenate([im[0], im[-1], im[:, 0], im[:, -1]])
    bg = np.median(border, axis=0)
    close = np.linalg.norm(im - bg, axis=2) < tol
    lab, _ = ndimage.label(close)
    edge_labels = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    mask = ~np.isin(lab, list(edge_labels))
    mask = ndimage.binary_opening(mask, iterations=1)
    rgba = np.dstack([im, mask * 255]).astype(np.uint8)
    out = Image.fromarray(rgba, "RGBA")
    return out.crop(out.getbbox())


def fit_h(img: Image.Image, h: int, resample) -> Image.Image:
    return img.resize((max(1, round(img.width * h / img.height)), h), resample)


jobs = {  # out name: (raw file, tolerance, height, resample)
    "fighter-you.png": ("fighter-you_0.png", 70, 150, Image.NEAREST),
    "fighter-her.png": ("fighter-her_0.png", 70, 150, Image.NEAREST),
    "controller.png": ("controller_0.png", 70, 60, Image.NEAREST),
    "portrait-her.png": ("portrait-her-ph_0.png", 28, 700, Image.LANCZOS),
    "portrait-her-sad.png": ("portrait-her-sad_1.png", 28, 700, Image.LANCZOS),
}
for name, (raw, tol, h, rs) in jobs.items():
    src = RAW / raw
    if not src.exists():
        print("skip (missing)", raw)
        continue
    fit_h(cutout(src, tol), h, rs).save(OUT / name)
    print("ok", name)
