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

## Replacement build, 2026-11-01 02:27 to 02:40 PST

Written from the PC session that rebuilt the fight; the upload ran through the Mac's signed-in Dia tab (app-routes rung 4). Every id below was read back from the edit page after Save and from the public page.

- Browser build: upload **20200964**, "GG EZ - browser campaign (2026-11-01)", GG-EZ-itch.zip, 2,442,046 bytes, SHA-256 21715750dc972c30985bab246661115489b29f5732d7e7057464f6e9b9bb6b1b, type html, embed checked, 1280x720, fullscreen on, mobile friendly on, SharedArrayBuffer off. Hosted frame: https://html-classic.itch.zone/html/20200964/index.html (itch's embed requests it as index.html?v=<unix time>). The hosted bundle assets/index-zvn4PRaG.js is byte-identical to the local dist (SHA-256 a1f46777b846e020c1a42c53b28fc607408989241b05cea133c84490649f8e9c).
- Concept PDF: upload **20200968**, "Concept and controls (2026-11-01)", 31,389 bytes, SHA-256 69cd6e56baa7545e1c09343fd6c73ec0b3a5c13d3364b393ac368d6a23647bd4; the earlier PDF 20200131 is renamed "Concept and controls (archive, 00:51)". The Godot build 20115262 and design notes 20198190 stay as archives. The 00:51 browser upload 20199994 is no longer listed on the edit page: itch dropped that row when a new file with the same name GG-EZ-itch.zip was uploaded (nothing was deleted by hand); its ZIP (SHA-256 67e516ec67bedf59edce223d69a5322b8ba06edd4e22984514e4e5d52903f782) is reproducible from commit 040d7ed.
- Cover: image **31669133**, Dain's new thumbnail at 630x500. Screenshots, in order: 31669139, 31669144, 31669148, 31669149, 31669151 (title, opening string with the finisher, the fair fight, the three-second chat, the cracked monitor). None shows the room.
- Short text (83 characters): You lose by a hair. She types "ez". Three seconds, two replies. Then one more game. Description: the four paragraphs in DESCRIPTION.md; the page no longer names the twist.
- Jam entry https://itch.io/jam/checkpoint-game-jam/rate/5254371 still reads "Submitted by carlcrafterz, 6 hours, 19 minutes before the deadline" (the original submission time; the jam form was not resubmitted). Jam close: 2026-11-01 03:59:59 PST.
- Source: branch dev/full-html-campaign at 3c5b9d6 and main at merge c2fe963 on GitHub.

Hosted checks:
- From the Mac (Playwright, index.html?v=1): hosted index references the local bundle, bundle byte-identical, title starts the game, collision room has no buttons, keyboard moves the ghost, no page errors and no failed requests (10:38:29 UTC).
- From the PC (`node tools/hosted-check.mjs 20200964`, 02:38 to 02:41 PST, versioned URLs): passed. All six autoplay routes (win and loss, each with credit, hostile and silence) completed on the hosted frame with 107 beats each; the real keyboard final fight with cast and block held ended in a loss after 15.3 s with 14 hits and 9 blocks, so the fair fight is losable; the real silence window measured 3,012 ms; no page errors and no failed requests.

One trap, recorded for next time: a GET of the bare frame URL made in the seconds between Save and itch's first-time unpack returned 404, and Cloudflare's San Jose edge cached that 404 (cf-cache-status HIT, max-age 2678183). Players are unaffected because itch's embed always requests index.html?v=<time>, a different cache key, and that returns 200. Never request the bare frame URL before the public page's Run button has done the first load; verify through the versioned form.

## Morning update after the deadline, 2026-11-01 09:44 to 10:3x PST

Carl's notes at 09:44: the GDD had vanished from the page, the trailer wanted a narrated cut, Lia's voice still sounded American, the hit freezes felt heavy, the pull into the monitor and the drawn food looked cheap, and the post-game survey was missing. The jam closed at 03:59:59; the project page and the jam form stayed editable.

- GDD: the 252 KB six-page design document is back as upload **20210090**, "Game design document (GDD)", first among the downloads (uploaded under the name GG-EZ-GDD.pdf so no row could be replaced by name). The page had lost it before this session: the 23:33 upload 20197680 was already absent by 00:51, and the 72 KB "GDD (1).pdf" archive 20198190 is what remained. The jam form's concept-doc field pointed at the concept brief, not the GDD; it now points at the GDD on GitHub main (commit 8bfcadc).
- Build v3: upload **20210294**, "GG EZ - browser campaign (2026-11-01 v3)", GG-EZ-itch.zip SHA-256 6601d720253fe12b4588cb3338ec48c19ba202206852370cc81b3be30ae4cb72, the only embed; 20200964 stays as a download. Changes: Lia's 22 lines are Microsoft's Filipino neural voice (fil-PH-BlessicaNeural through edge-tts; CREDITS.md has the record); the crack opens into a draft that lifts, stretches and pulls the body through, with air streaks and paper scraps; hit freezes cut to 30 to 60 ms (240 ms on the finishing blow); the adobo tub, rice, bay leaf and spoon are pixel PNG sprites; three survey questions after the credits, answers kept on the device and on the finish record, with an endpoint constant for later collection.
- Concept PDF v2: upload **20210296**, "Concept and controls (2026-11-01 v2)", SHA-256 591e26451c1d2c72bc2878456d36b0c09726ab9f82b2716e0fb02b8c0136db6c, with the voice credit corrected; 20200968 renamed as the 02:27 archive. The page description's credit sentence now names the Microsoft voice; the in-game credits card does too.
- Hosted checks on 20210294: itch's own Run game first (frame index.html?v=1793556120 showed Start game), then three curls of ?v=1 all 200 with cf-cache-status MISS, then the Mac end-to-end run passed (bundle byte-identical, title, room, keyboard, no errors). The PC run (`node tools/hosted-check.mjs 20210294`) is appended below.
- Hosted check from the PC (`node tools/hosted-check.mjs 20210294`, 10:07 to 10:14 PST): passed; all six endings completed on the live frame, the real keyboard final fight won in 14.1 s with 15 hits and 4 blocks, the silence window measured 3,012 ms, no page errors and no failed requests.
- Trailer: narrated 70.6-second cut from real play of the v3 build (narration by Microsoft's en-PH-JamesNeural voice, arcade loop under it), SHA-256 e18865cad790d6f2616b272149cd77b842ac40579c4bdc6e83b9beda32cd6e1f, committed as docs/trailer/build_trailer.mp4 at 3bfa075 with the 00:51 montage kept beside it; itch download row **20210676**, "Trailer, narrated (2026-11-01)". The first cut had been recorded from a stale 01:15 build and was replaced before it was ever visible.
- Jam form (still editable after the deadline): concept-doc field now https://raw.githubusercontent.com/CarlKho-Minerva/gg-ez/8bfcadc1f8711a66e892e75ee924e5ec2933cc1c/docs/GDD.pdf; video field now https://raw.githubusercontent.com/CarlKho-Minerva/gg-ez/3bfa075195af340c69d33945987e532d97bc720a/docs/trailer/build_trailer.mp4; both saved ("Entry submitted to jam") and read back from a fresh load. The team, registration and eligibility answers were not touched.

## Afternoon update, 2026-11-01 13:50 to 14:2x PST: the right ElevenLabs account, a Cebuano voice, the GDD rewritten

Carl's notes at 13:50: use the ElevenLabs account that got the Creator-level credits from Nimble Fox, redo all the voice lines with it, and rewrite the GDD in the research-writing voice with evidence on every claim.

- Account: the ElevenLabs account signed in on Dia is carl@somach.life, on a "grant" plan (33,110,000 characters, 0 used before this work) from the Nimble Fox gift link redeemed 2026-10-29. An API key named gg-ez-voice was created on it through the Dia session (text to speech, voices write, user, models, sound effects, voice collections read) and stored only in the Mac's env file as ELEVENLABS_API_KEY_GRANT. The older key in that file belongs to a separate free account.
- Voice: all 22 Lia lines regenerated with the Voice Library voice "Ate Marcela" (a published Cebuano voice, ceb-PH, voice id NL3wAdhrhsFZAoDTBMHk), eleven v3, Cebuano language setting on the eleven lines with Cebuano, 1,461 characters used. No young Cebuana exists in the library; the three other Cebuano-tagged female voices are Hiligaynon-cadenced, male by description, or a horror narrator. A full alternative set with Jesi is kept outside the repo for an ear test. CREDITS.md records it. Nobody has listened yet.
- Build v4: upload **20216318**, "GG EZ - browser campaign (2026-11-01 v4)", ZIP SHA-256 c7285d68a730a77cb927245d9d80afd2edf5fa5be71c0a62c93070f2568b1423, the only embed; v3 20210294 and the 02:27 build stay as downloads. Hosted from the Mac: Run game first, frame index.html?v=1793570711 showed Start game, three curls of ?v=1 all 200 with cf-cache-status MISS, hosted-check2 passed (bundle byte-identical, room reached, keyboard moves the ghost, no errors). Local campaign suite on the v4 package: pass (final fight won in 11.0 s with 15 hits; silence 3,020 ms; passive loss at 30.4 s); 40 clips decode, 131.2 s.
- Concept PDF v3: upload **20216415**, SHA-256 ca7d170deec172d94ef3a3202864b48ece53d5c2c91c4e4e48a79860d600936a, with the Ate Marcela credit; 20210296 renamed as the 10:00 archive. The page description's credit sentence names the voice; so does the in-game credits card.
- GDD: rewritten in the Experimental History voice with a source on every factual sentence and a status word (measured, tested, storyboarded, proposed, not yet verified); 8 pages, rendered by tools/render_gdd.sh (pandoc to HTML with gdd.css, then WeasyPrint), figure regenerated. docs/GDD.pdf SHA-256 1610af860aaaca1c241149c37f640c2690f513e8a4f08550239bc7085a3257d7 at commit 4297ff6; the 2026-10-31 document is kept beside it as GDD-2026-10-31. On itch it is upload **20216555**, "Game design document (GDD, 2026-11-01)", first download after the build; 20210090 renamed "Game design document (archive, 10:00)". The jam form's concept-doc field now points at https://raw.githubusercontent.com/CarlKho-Minerva/gg-ez/4297ff654b00188bc89da3a685fe354780ed03b9/docs/GDD.pdf (saved, "Entry submitted to jam", read back from a fresh load); the video field is unchanged.
- Hosted check from the PC on 20216318 (`node tools/hosted-check.mjs 20216318`, 14:15 to 14:25 PST, versioned URLs): passed. All six endings completed on the live frame; the real keyboard final fight with cast and block held won in 12.7 s with 15 hits and 7 blocks; the silence window measured 3,019 ms; no page errors, no failed requests.

## 14:20 PST: transcription check, one retake, build v5

ElevenLabs speech-to-text set to Cebuano reads Ate Marcela's eleven Cebuano lines back at a mean word match of 0.77 (Jesi alternative 0.59; tools/stt_check.py). "Kana. Customer empathy." was retaken once and now reads back exactly; "Usa pa." is heard without a word break in every take and stays. Build v5 is upload **20216810**, ZIP SHA-256 9fb20f8603122fec0517cb2cf616008ceb9604b8e44be4704f21fa2db8c852e8, the only embed; v4 20216318 stays as a download. Hosted from the Mac: Run game first, three curls of ?v=1 all 200 with cf-cache-status MISS, the retaken clip served from the frame with the v5 hash, hosted-check2 passed. Hosted from the PC (`node tools/hosted-check.mjs 20216810`): passed, all six endings, the real keyboard final fight won in 13.4 s with 15 hits and 2 blocks, silence 3,015 ms, no errors. The GDD with the transcription numbers is upload **20216866** (SHA-256 7baf6887722650e0450800744bcc3038c75404d980b3d074533a487d839c497c), first download; 20216555 renamed as the 14:13 archive; the jam form's concept-doc field points at https://raw.githubusercontent.com/CarlKho-Minerva/gg-ez/828ee20bd0a6c10a153e9e928a82955811ef0f98/docs/GDD.pdf (saved, read back).
