# Handoff, 2026-10-28 17:45 PT (Mac shutting down; continue on the PC)

State: the game plays end to end in Godot 4.7 (`godot --path . -- --autoplay` plays itself). Pushed to https://github.com/CarlKho-Minerva/gg-ez. The Mac was shut down mid-batch, so two placeholders remain: `assets/fighter-her.png` (opponent, currently a red block) and `assets/controller.png` (black block). Regenerate on the PC GPU with `tools/checkpoint_assets.py fighter-her controller` (needs the krea venv: diffusers + Krea-2-Turbo), then `tools/process_assets.py <raw dir>`.

Carl's notes from the first look (17:35):
- Floor was misaligned with the platform art: FLOOR_Y is now 436 (measured). Verify by eye.
- Too fast-paced; the story reads like a movie, no feeling yet. He wants a loopable core loop and real rage.
- Player should be the sword hero (done: fighter-you is the blue swordsman), with a queue + username screen (done) and a feedback form + metrics (done, PostHog key still empty).
- Make her look more Filipino (done: new portraits).

## Direction to build next (Claude's recommendation, not yet agreed with Dain)
Rage comes from near-misses, not from a wall. Loop:
1. One 30 s match. Rigged so you lose by a hair: her last hit lands when she is at 90%+, your finisher whiffs once per match, one input "lags" at the worst moment.
2. On every KO a 3 s chat window: she types "ez". Pick a reply or let it time out (timeout is logged as "said nothing").
3. After the 3rd loss a RAGE QUIT button appears next to REMATCH. Rage quit = throw the controller = the turn into her room. Rematch = loop again (the room arrives anyway after loss 5).
4. Her room shows one more thing each visit (hotspots already exist). Then you queue again.
5. The rematch loop is the measurement: time-to-reply and nice/mean per loop. The game ends when the player picks nice twice in a row, or quits from the room.

## PC steps
- Install Godot 4.7 (winget or the Steam-free download), clone the repo, `godot --path . -- --autoplay` to see it run.
- Web export: `godot --headless --export-release Web build/index.html` after installing export templates 4.7.2 in the editor. Not yet done anywhere.
- Set POSTHOG_KEY in main.gd (PostHog project, public key) so feedback reaches PostHog.
