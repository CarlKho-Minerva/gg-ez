# Handoff, 2026-10-28 18:35 PT

Everything for the Checkpoint itch.io submission exists; only the itch.io page and the jam form are left, and both need a signed-in browser (plan: `SUBMIT_ITCH.md`).

- Game: intro from three pixelised Pexels clips (street, pisonet, player), a practise-each-key tutorial, then the rage loop (30 s near-miss match with hit stop, whiff, lag, her percent red past 90; 3 s "ez" window; rematch / rage quit; growing room visits; nice-twice ending). Bot run verified end to end at commit d2b3970.
- Sound: thirteen ElevenLabs clips in `assets/sfx/` (credits in `assets/sfx/CREDITS.md`), loops for the street, the CRT hum and her room.
- Web build: `gg-ez-web-final.zip` (13.9 MB, single-threaded export, loads on plain http and itch.io); exported on the PC, verified in a browser on the Mac at commit 00b512c and re-exported at d2b3970.
- Trailer: `build_trailer.mp4`, 2:00, real footage of the autoplay run with the new sounds (not in git; also in the scratch folder of the 2026-10-28 session).
- Brief: `~/CODELocalProjects/checkpoint-jam/docs/CONCEPT_BRIEF.md` and `.pdf`, rewritten from this loop.
- Hogpatch jam (Nimble Fox): the one-prompt version is `NIMBLEFOX_PROMPT.md`.

Still open: POSTHOG_KEY is empty; both Alchemer registrations unconfirmed; Dain has not seen any of tonight's build.

---

## Earlier handoffs

# Handoff, 2026-10-28 18:20 PT (built on the Mac after all; the PC pivot was dropped)

State: the game is the rage loop now. `godot --path . -- --autoplay` plays it end to end (verified headless: 5 losses, a silent timeout, a rage quit at loss 3, one room visit, nice twice, end, feedback). All sprites are real; `assets/fighter-her.png` and `assets/controller.png` were cut from `tools/raw/` which already held the generated art (the old note that they needed regenerating was wrong).

## The loop (main.gd)
1. One 30 s match (`MATCH_TIME`). Your hits now land for 9-14%. She never leaves the stage ("teched it"). At 90%+ three rigs fire once each: your next swing in range WHIFFS, your next input "lags" 0.45 s ("..."), and she charges the finisher you cannot survive. If you never get her to 90, the timer does it.
2. KO. She types "ez". A 3 s reply window (`REPLY_WINDOW`) with a countdown. Nothing picked = "said nothing", logged with reply_ms 3000.
3. Defeat card: REMATCH (space works). After 3 losses since the last room visit (`RAGE_AFTER`) a RAGE QUIT button appears. After 5 (`FORCED_AFTER`) the controller flies on its own.
4. Rage quit = the controller = the crack = her room. Visit 1 shows the phone and two things; each visit adds one hotspot (`_hotspots_now`). A "log off" button in the room ends the game.
5. Then her side ("queue again") and the same two replies. The game ends on two nice replies in a row once you have seen the room at least once (`nice_streak`, `visits`), or at 8 losses (`MAX_LOSSES`), or log off.
6. End card lists every loss: pick, reply time or "rage quit". `result` and `feedback` events carry the whole loop array (user://feedback.jsonl, PostHog if the key is set).

Rig tunables are the constants at the top of main.gd. The first nice reply still "could not be sent" and does not count toward the streak.

## Still open
- Feel: Carl's note (17:35) was "too fast, reads like a movie". The loop addresses the structure; the match itself still wants a human pass (hit pause, screen shake on her hits, a sound when the whiff happens).
- Web export: `godot --headless --export-release Web build/index.html` after installing export templates 4.7.2 in the editor. Not done.
- POSTHOG_KEY in main.gd is empty.
- The Checkpoint concept brief (checkpoint-jam/docs/CONCEPT_BRIEF.md) sections 2-7 still describe the retired cookie-chain game. Rewrite from this loop before Oct 31.
- Both registration forms, the itch.io page, the 2-minute trailer.

---

## Earlier handoff (17:45 PT)


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

## Builds and playtesting (set up 2026-10-28 18:40 PT on the PC, by the Mac thread)
- **Browser build, playable from any OS inside the tailnet:** https://sixseven-carl.tail979b70.ts.net/index.html (Tailscale serve on the PC, proxying a tiny Python server on port 8808; both are logon tasks `gg-ez-web`). The Windows firewall has a "Python: Block" rule, so the raw port is unreachable from other machines; Tailscale serve bypasses it.
- **Auto-rebuild:** scheduled task `gg-ez-build` on the PC pulls GitHub `main` every 5 minutes and re-exports the web build when it moved (`C:\Users\Carlk\gg-ez-build.ps1`, log `C:\Users\Carlk\gg-ez-build.log`). Push to main and the URL above updates within about 6 minutes. The PC clone is reset hard to origin/main, so never edit in the PC clone.
- **itch.io upload:** the zip is at the URL above as `/gg-ez-web.zip` (also `build\gg-ez-web.zip` on the PC). itch.io: new project, kind "HTML", upload the zip, tick "This file will be played in the browser", viewport 1280x720. SharedArrayBuffer is not needed (threads off in `export_presets.cfg`). butler is not installed anywhere and no itch API key is on file, so the upload is a manual step for Carl.
- **Moonlight:** the PC's Sunshine app list has a `GG` entry that launches the Godot project on the desktop, for native playtests from the Mac or the Zenbook.
- Web build size: `index.wasm` is 39.5 MB uncompressed; itch.io serves it gzipped (about 10 MB). Over a phone hotspot it took about 2.5 minutes to load; on Wi-Fi it is seconds.
