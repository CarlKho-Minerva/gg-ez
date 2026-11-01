# Story scenes: the contract every scene follows

Written 2026-10-31 night, when the eight storyboard boards moved from Figma into Godot. One agent per board, all at once, so the rules below are what keeps eight scenes compatible without anyone editing the same file.

## Where things go

- One folder per board: `scenes/story/<id>/` with `<id>.tscn` (root Node2D, script attached) and `<id>.gd`. Ids: `s1` title and matchmaking, `s2` first humiliation, `l2` opening loss 2, `l3` opening loss 3 with the vacuum and Lia's replay, `visit1` first visit and the three objects, `m2` second match, `v2` second arrival in work mode, `c1` the customer call.
- `<id>.gd` starts with `extends "res://scenes/story/story_scene.gd"` (by path, not by class name: the global class cache does not exist outside the editor). Do not edit `story_scene.gd`, `preview.gd`, `main.gd`, `main.tscn` or `project.godot`. If the base script lacks something, write the helper inside your own scene script.
- Art: Dain's sprites are in `assets/dain/` (`arena-bg.png` 512x224, `lia-wizard.png` 46x43, `wolf.png` 32x37, `lia-spell.png` 238x73, `wolf-crescent.png` 41x32, `lia-room-wip-20261031.jpg` as a reference for her room, two reference screenshots). Draw them with `pixel_sprite()` at `PIX` (2.5x) so the arena fills the width; feet sit on `ARENA_FLOOR`. The wolf sprite faces left and Lia faces right as drawn; flip with `flip_h`. Anything the storyboard calls a placeholder (Lia at home, the ghost form, room furniture) is drawn with `rect()` and `label()` in the gray graybox colours, never with new generated art.
- Sound: use the existing clips in `assets/sfx/` when a card names a sound that exists there; otherwise leave a comment with the cue. No new audio files.

## How a scene runs

- `start(ctx)` is called once by whoever hosts the scene; it calls your `run()`. `run()` is one `async` walk through the storyboard cards in order. For every card: put it on screen, then `await mark("<card id>")` (for example `await mark("M2.3")`), then `await hold(<draft seconds>)` or `await wait_advance()` where the card says the player advances.
- Alternatives (A, B, C cards) come from `await choose([...], pos)`; in autoplay the pick is `ctx.pick` or the first option. Mark the card of the branch actually taken, e.g. `mark("M2.7A")`.
- Reads from earlier scenes come in `ctx` (`seen`: which objects the player observed; `losses`; `pick_history`). Do not invent other keys; put anything you want to pass on into `finish({...})`.
- End with `finish(result)`. Never call `get_tree().quit()` or change scenes yourself.
- Dialogue is the exact storyboard text. Cebuano lines carry their English gloss as a smaller second label under the balloon, as the storyboard notes show. The same reply pair everywhere a chat choice appears: `okay that was clean` / `fuck off`, plus the timer running out as silence.

## Proving it works

Godot has no headless rendering, so the preview runner needs a window. From an SSH shell on the Mac, run it inside the GUI login session:

```
cd /Users/carl/CODELocalProjects/pi-labs/2026-11-01-gg-ez-act3 && python3 gui_run.py --cwd <your worktree> --timeout 180 -- /opt/homebrew/bin/godot --path . scenes/story/preview.tscn -- scene=res://scenes/story/<id>/<id>.tscn
```

It writes `build/preview/<id>/NN-<card>.png` (one per `mark`) and `result.json`, and prints `PREVIEW_DONE`. Copy the PNGs to the PC with scp and look at every one of them before saying the scene is done: text inside the frame, sprites on the floor, balloons pointing at the right head. Also run `godot --headless --path . --check-only -s scenes/story/<id>/<id>.gd` for a syntax pass first; it is fast and needs no window. Exit code and `PREVIEW_DONE` are the proof; a script that prints OK is not.

## Commits

Work only in your own worktree and branch (`dev/scene-<id>`). Commit as `Carl Kho <kho@uni.minerva.edu>` with the `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` trailer, only files under `scenes/story/<id>/`, and push your branch. Do not merge, rebase or touch other branches. `build/` is ignored.
