# Checkpoint jam (Carl + Dain) asset batch, 2026-10-28.
#   venv/bin/python checkpoint_assets.py [name ...]   # no args = all shots
import gc, sys, time
from pathlib import Path
import torch
from diffusers import Krea2Pipeline

OUT = Path(__file__).parent / "outputs" / "checkpoint"

PIX = ("16-bit pixel art, retro arcade fighting game sprite, crisp pixels, limited palette, "
       "flat solid magenta background, full body, single character, centered")
VN = ("flat cel-shaded illustration, visual novel art style, clean line art, soft muted colors")
HER = "a tired young Filipina woman in her early twenties, morena warm brown skin, Southeast Asian Filipino facial features, long straight black hair in a messy ponytail, oversized faded t-shirt, gaming headset around her neck"

SHOTS = [  # name, prompt, n, width, height
    ("bg-arena", "16-bit pixel art fighting game stage, one wide floating stone platform over a purple and orange sunset sky, small clouds, retro arcade, side view, empty stage, no characters, no text", 3, 1344, 768),
    ("fighter-you", f"{PIX}, a young blue-haired swordsman hero with a headband, short tunic and a raised sword, side view facing right, fighting stance", 3, 1024, 1024),
    ("fighter-her", f"{PIX}, a sleek powerful armored fighter with a flowing red scarf and a glowing blue energy blaster, side view facing left, confident stance", 3, 1024, 1024),
    ("controller", "pixel art of a black game controller, flat solid magenta background, centered, single object", 2, 1024, 1024),
    ("room-reveal", f"{VN}, view from behind and slightly to the side of {HER} sitting at a cheap desk in a small cramped bedroom in Manila at night, her PC monitor glows with a retro pixel fighting game, electric fan, instant noodle cup, a call center ID lanyard on the desk, phone face up on the desk, laundry on a chair, one dim lamp, quiet and lonely mood", 4, 1344, 768),
    ("portrait-her-ph", f"{VN}, upper body character portrait of {HER}, tired eyes, small polite smile, facing the viewer, plain white background", 2, 1024, 1024),
    ("portrait-her", f"{VN}, upper body character portrait of {HER}, tired eyes, small polite smile, facing the viewer, plain white background", 3, 1024, 1024),
    ("portrait-her-sad", f"{VN}, upper body character portrait of {HER}, looking down at a phone in her hands, sad and exhausted, plain white background", 3, 1024, 1024),
]
SEED = 31031
ORDER = ['portrait-her-ph', 'room-reveal', 'portrait-her-sad', 'portrait-her', 'fighter-you', 'fighter-her', 'controller', 'bg-arena']
COUNTS = {'room-reveal': 2, 'portrait-her-sad': 2, 'portrait-her': 2, 'fighter-you': 2, 'fighter-her': 2, 'controller': 1, 'bg-arena': 1}

def main():
    want = set(sys.argv[1:])
    OUT.mkdir(parents=True, exist_ok=True)
    t0 = time.time()
    pipe = Krea2Pipeline.from_pretrained("krea/Krea-2-Turbo", torch_dtype=torch.float16).to("mps")
    print(f"model ready in {time.time()-t0:.0f}s", flush=True)
    for name, prompt, n, w, h in sorted(SHOTS, key=lambda x: ORDER.index(x[0])):
        n = COUNTS.get(name, n)
        if want and name not in want:
            continue
        for i in range(n):
            g = torch.Generator("mps").manual_seed(SEED + i)
            t1 = time.time()
            img = pipe(prompt, height=h, width=w, num_inference_steps=8, guidance_scale=0.0, generator=g).images[0]
            p = OUT / f"{name}_{i}.png"
            img.save(p)
            print(f"{p.name} {time.time()-t1:.1f}s", flush=True)
    del pipe; gc.collect(); torch.mps.empty_cache()

if __name__ == "__main__":
    main()
