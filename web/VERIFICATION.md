# HTML campaign verification — 2026-11-01

## Current collision / character-polish build

- Production typecheck, Vite build and packaging passed. Release check `5qev3ukpg` completed successfully in 462 seconds.
- All six outcome/reply routes passed, 107 beats each. Real final combat: 9 hits, 2 blocks; silence timeout: 3,120 ms; passive opening progressed without input.
- Packaged standalone normal-controls playthrough passed in 251.903 seconds, all 13 chapters, all three discoveries, victory and credits, no JavaScript errors. This automated driver advances dialogue promptly; it is not a human reading-time estimate.
- Collision-only exploration passed keyboard, pointer, scaled mobile touch, locked monitor, object re-entry, and reduced-motion checks. Ten 100-ms updates move 225 pixels; a simulated long resume advances at most 22.5 pixels.
- Shutdown left no generated room-rig textures or UI buttons. Testing caught and fixed a camera-cleanup ordering error: Phaser may remove the camera before the scene shutdown callback.
- Presentation checks confirmed fighter footwork, exactly one proportionally scaled transition character, and no transition camera shake. Inspected `cracked-screen.png` and `lia-on-call.png` after the final run.
- All 40 MP3s decoded, totaling 114.080 seconds. Nested `/game/` serving passed without missing assets.
- ZIP integrity: 53 files, 2,655,977 bytes compressed, 3,618,637 bytes unpacked, root index present, all CRC checks passed. SHA-256: `67e516ec67bedf59edce223d69a5322b8ba06edd4e22984514e4e5d52903f782`.

### Hardening and resource review

The articulated room character uses a fixed number of cropped parts, one update listener, and no per-frame tween or timer allocations. Independent tests covered Canvas/WebGL, reduced motion, invalid poses, concurrent instances, texture-construction rollback, and 80 cleanup cycles. Scene-level shutdown checks now also pass. Effects are capped at 16 live graphics; audio pools are capped at four elements per clip; exploration examines four fixed hotspots. Movement delta is bounded to avoid unbounded resume jumps.

Headless sustained-room rendering measured median 116.7 ms and p95 133.4 ms per frame on this busy Office Mac: this is **not** a smooth-frame-rate certification. An isolated follow-up measured 83.3 ms animated versus 83.4 ms for an empty page, with substantial variation between conditions; it cannot isolate the rig's rendering cost. No peak process-memory benchmark or physical-phone performance test was performed. Rig/listener cleanup, bounded object counts, archive size, functional touch emulation, and low-frame-rate movement were verified; smoothness on other devices remains a human-playtest item.

`npm test` now includes campaign and collision/mobile exploration tests. `npm run test:playthrough` checks the packaged standalone; `node tools/presentation-test.mjs` checks motion and reports frame samples. Evidence lives in `verification/` and `/Users/carl/CODELocalProjects/pi-labs/2026-11-01-gg-ez-collision/`. The release reviewer found stale control/test descriptions; those have been corrected in README and this file. Final Azure review `id299h80p` reported only a missing build prerequisite in README (severity 2/5). README now explicitly runs `npm run package` before `npm test`; checked against the actual package script, which builds first. The outdated candidate/publication sentence was also corrected. No runtime code changed after the passing release checks; a further clean reviewer rerun was not performed.

### Publication

Published to the existing project and jam entry on 2026-11-01 before close. Browser upload **20199994** is selected; old Godot upload **20115262** and original design notes remain available as labeled archives. Current concept PDF is upload **20200131**. The public page points to the new hosted frame and lists Phaser.

Hosted check `58kutbpw0` passed: actual hosted JavaScript byte-for-byte matches the packaged script, Start enters the story, the exploration room contains no buttons, and keyboard movement works; no missing assets or page errors. Inspected `hosted-room.png`. Hosted script SHA-256: `f811c6aa68d5789ffd9b363d7f745b6b0c80cd7cba00c91264f055b69babe80b`.

Matching two-page concept and 106.920-second silent actual-gameplay montage were published in Git commit `2b5b757b8819e7f7ce52339cff40f7351648f8df`; both public downloads returned HTTP 200 and matched local hashes. Existing jam fields now point to immutable URLs for those files. The old materials remain in Git history. AI disclosure and page controls/credits were corrected; current Dain artwork is distinguished from historical Krea-generated assets. The registration email now matches Carl's organizer confirmation in `kho@uni.minerva.edu`.

Dain's country placeholder and existing personal-attestation answers were not changed or independently validated. Asked Carl for her country and individual-registration status, with the question also placed on his primary Google Calendar at 02:00 PST before the 03:59:59 PST deadline.

Public game: https://carlcrafterz.itch.io/gg-ez

Existing jam entry: https://itch.io/jam/checkpoint-game-jam/rate/5254371

## History: earlier HTML candidate, before collision / character polish

- TypeScript and Vite production build: pass.
- Six complete campaign paths (win/loss × credit/hostile/silence): pass, 107 recorded beats each, all 13 chapters.
- Win-branch sarcasm persists into the final choice: pass.
- Real keyboard final fight: victory with 9 landed hits and 2 successful blocks.
- Real silence timer: 3,014 ms in the final run.
- Standalone HTML opened from a file URL at 960×540: normal-controls full playthrough completed in 196.985 seconds, all three room objects inspected, credits reached, no JavaScript errors. This driver advances text promptly; a reading playthrough takes longer.
- Browser decoding: all 40 bundled MP3s pass (114.08 seconds of unique audio).
- Nested /game/ serving: no missing assets; no runtime remote dependency.
- ZIP: all 56 entries pass CRC verification, index.html is at root, 40 MP3s included.

Tests write screenshots and machine-readable results to the ignored verification/ folder. `npm test` runs the six routes, real combat, and timer checks; `node tools/playthrough.mjs` checks the packaged standalone HTML. Set PREVIEW_BROWSER or install Playwright Chromium first.

Human playtest focus: Cebuano pronunciation and glosses, dialogue pacing, final fight balance, and room pose clarity using the existing art. The thirteen-chapter structure and all ending paths are implemented; this is a playable candidate, not a claim that human playtesting is finished. The current itch upload has not been modified.
