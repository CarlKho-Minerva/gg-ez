# itch.io submission log, Checkpoint Game Jam

Written 2026-10-31 22:47 PDT by the submission agent, from the Mac's signed-in Dia browser (app-routes rung 4, no screenshots). Every line below was read back from itch.io itself.

## Result

- Project page, public: https://carlcrafterz.itch.io/gg-ez (itch account `carlcrafterz`, project id 5254371, kind HTML, release status Prototype, pricing No payments).
- Jam entry: https://itch.io/jam/checkpoint-game-jam/rate/5254371. The page read "Submitted by carlcrafterz — 6 hours, 19 minutes before the deadline" with "Edit this submission / Remove this submission" controls; the jam's entry count went from 35 to 36.
- The browser build runs on the public page: "Run game" loads `https://html-classic.itch.zone/html/20115262/index.html` (viewport 1280x720, fullscreen button on, mobile off, SharedArrayBuffer off).

## What is on the page

- Playable: `gg-ez-web-final.zip` (13 MB, uploaded 2026-10-28, now marked "This file will be played in the browser").
- Downloads: `CONCEPT_BRIEF.pdf` (32 kB) and `build_trailer.mp4` (22 MB). Their duplicate uploads from 2026-10-28 stay hidden; nothing was deleted.
- Cover 630x500 and four 1280x720 screenshots from the trailer footage (`docs/itch/`).
- Description: `docs/itch/DESCRIPTION.md` verbatim (body keeps Quezon City because the build says so; Lapu-Lapu City only in the roadmap paragraph).
- Tags: 2d, godot, narrative, pixel-art, short, singleplayer (itch dropped `social-impact`). Genre: Fighting (second save answered "Saved"; read back after reload). AI disclosure: Yes.
- No UN name or emblem on the page.

## Jam form answers

Project GG EZ · Team leader Carl Kho · Email carlkho.cvk@gmail.com · Team size 2 · Additional members "Dain Kim, kim@uni.minerva.edu" · Country "Philippines (Carl Kho, team leader). Dain Kim: country of residence to be confirmed by her." · Concept doc https://github.com/CarlKho-Minerva/gg-ez/raw/main/docs/CONCEPT_BRIEF.pdf · Video https://github.com/CarlKho-Minerva/gg-ez/raw/main/docs/trailer/build_trailer.mp4 · Age 18+ Yes · Team eligibility Yes · Individual registration Yes · Policies Yes · AI use Yes, with the tool list (Claude, Krea 2 Turbo, ElevenLabs, ffmpeg on Pexels clips).

## Open items for Carl

1. **Individual registration.** The form attests that both members registered on the Alchemer form (https://survey.alchemer.com/s3/9000801/Registration-for-Checkpoint-Game-Jam). SUBMIT_ITCH.md of 2026-10-28 said Carl's was unconfirmed and Dain's unknown. If either is missing, register tonight; the jam says a missing registration "may result in disqualification".
2. **Dain's country** is written as "to be confirmed"; edit the submission if she wants it stated.
3. The registration email on the form is carlkho.cvk@gmail.com; if Carl registered with another address, edit the submission.

## Repo commits made for the form links

- 0f74e83 docs: concept brief PDF for the Checkpoint jam form
- 441130f docs: two-minute trailer of the submitted build, for the jam form (force-added past .gitignore)

## Recovery update, 2026-10-31 23:33 PDT

The earlier record above is preserved. The following checks supersede its outdated open items where stated.

- Added `GDD.pdf` as visible documentation, upload **20197680**, without changing the browser-game upload **20115262**, existing downloads, description or jam-form answers. The public page lists the new PDF. Downloaded it anonymously and compared its bytes with the reviewed local file: identical, **252,337 bytes**, SHA-256 `b7efcca7fc90e5b79f3bc47280d54dc45c3a8829a77bdbb36ae9f3c6d045c800`.
- The six-page document and source are commit `bbcb4f5`. All six requested final Azure reviews reported no issues after corrections. The render, visual checks, seven failure tests and resource measurements are recorded in `build/gdd-review/REVIEW.md`. The PDF separates existing gameplay from the proposed thirteen-scene campaign.
- A fresh anonymous browser check loaded the existing hosted game, entered a test username, reached a knockout and let the reply clock expire. It emitted the expected start, queue, knockout and silence-choice events, with no page errors or failed HTTP responses. This verifies one round, not a complete campaign or all ending branches. The original playable ZIP was not replaced.
- Recovered development work remains separate: `dev/web` at `c5970c2` contains the tested Phaser scaffold and second-match preview, not the submitted game; `dev/audio` at `0d7fcaf` contains a source-linked audio inventory and dry-run-first generation tooling. No audio was generated and no ElevenLabs credits were spent. The audio tests pass, but its independent Azure review did not run; see that branch's `docs/audio/VERIFICATION.md`.
- **Carl's individual registration is confirmed.** The October 13 organizer email, “Welcome to Checkpoint Game Jam!”, received in `kho@uni.minerva.edu`, explicitly says its recipient is officially registered. The form currently uses `carlkho.cvk@gmail.com`; it was not silently changed or resubmitted.
- **Dain's separate registration remains an open factual question**, not a confirmed omission. Asked Carl directly and placed the same question on his primary Google Calendar for 23:40 PDT. No message was sent to Dain and no registration attestation was invented.
- The existing page's roadmap paragraph overstates how many scenes already have grayboxes. Its wording was left untouched in this PDF-only update; the new PDF's scene-by-scene status map is the checked record.
