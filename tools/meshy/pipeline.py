#!/usr/bin/env python3
"""Meshy pipeline for the two GG EZ fighters: preview -> refine -> rig -> animate -> assets/3d/*.glb

  MESHY_API_KEY=... python3 tools/meshy/pipeline.py   (reads tools/meshy/<name>.preview.json for task ids)

Writes tools/meshy/<name>.state.json after every step so a rerun resumes. Never prints the key.
"""
import json, os, sys, time, urllib.request

API = "https://api.meshy.ai/openapi"
KEY = os.environ["MESHY_API_KEY"]
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "..", "assets", "3d")
os.makedirs(OUT, exist_ok=True)

# Preset animations from GET /openapi/v1/animations/library (2026-10-28).
ACTIONS = {
    "you": [89, 97, 105, 102, 86, 178, 7, 466, 13],   # combat idle, left slash, triple combo, sword judgment, jump attack, hit, fly up, jump, run
    "her": [89, 104, 98, 103, 156, 179, 7, 466, 13],  # combat idle, side shot, run and shoot, kick, dodge, hit, fly up, jump, run
}


def call(method, path, body=None):
    req = urllib.request.Request(API + path, method=method, headers={"Authorization": "Bearer " + KEY, "Content-Type": "application/json"},
                                 data=json.dumps(body).encode() if body is not None else None)
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())


def wait(path, label, every=20, limit=1800):
    t0 = time.time()
    while time.time() - t0 < limit:
        d = call("GET", path)
        st = d.get("status")
        print(f"{time.strftime('%H:%M:%S')} {label}: {st} {d.get('progress')}", flush=True)
        if st == "SUCCEEDED":
            return d
        if st in ("FAILED", "CANCELED"):
            raise SystemExit(f"{label} {st}: {d.get('task_error')}")
        time.sleep(every)
    raise SystemExit(f"{label}: timed out after {limit}s")


def state(name, **kw):
    p = os.path.join(HERE, f"{name}.state.json")
    s = json.load(open(p)) if os.path.exists(p) else {}
    s.update(kw)
    json.dump(s, open(p, "w"), indent=1)
    return s


def run(name):
    s = state(name)
    if "preview" not in s:
        s = state(name, preview=json.load(open(os.path.join(HERE, f"{name}.preview.json")))["result"])
    wait(f"/v2/text-to-3d/{s['preview']}", f"{name} preview")
    if "refine" not in s:
        r = call("POST", "/v2/text-to-3d", {"mode": "refine", "preview_task_id": s["preview"], "enable_pbr": False})
        s = state(name, refine=r["result"])
    wait(f"/v2/text-to-3d/{s['refine']}", f"{name} refine")
    if "rig" not in s:
        r = call("POST", "/v1/rigging", {"input_task_id": s["refine"], "height_meters": 1.75})
        s = state(name, rig=r["result"])
    wait(f"/v1/rigging/{s['rig']}", f"{name} rig")
    if "anim" not in s:
        r = call("POST", "/v1/animations", {"rig_task_id": s["rig"], "action_ids": ACTIONS[name]})
        s = state(name, anim=r["result"])
    d = wait(f"/v1/animations/{s['anim']}", f"{name} animations")
    url = d["result"]["animation_glb_url"]
    dst = os.path.join(OUT, f"{name}.glb")
    urllib.request.urlretrieve(url, dst)
    state(name, glb=dst, glb_bytes=os.path.getsize(dst))
    print(f"{name}: {dst} {os.path.getsize(dst)} bytes", flush=True)


if __name__ == "__main__":
    names = sys.argv[1:] or ["you", "her"]
    import threading
    th = [threading.Thread(target=run, args=(n,)) for n in names]
    for t in th: t.start()
    for t in th: t.join()
    print("balance", call("GET", "/v1/balance"))
