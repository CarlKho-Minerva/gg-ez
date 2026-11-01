# GG EZ Game Design Document

GG EZ is a short browser fighting game about the reflex to insult a stranger who has just beaten you. You lose by a hair, she types "ez", and you get three seconds and two replies. Then there is one more game. The build on itch.io runs thirteen chapters from the title to the credits; all six routes through them pass an automated suite, and the number that matters most, the reply window, measured 3,012 milliseconds on the hosted page. In words: the clock the player sees is the clock the code keeps.

Carl Kho and Dain Kim. Written 2026-11-01 for the Checkpoint Game Jam 2026 (UNOCT and UNICRI with Global Game Jam, theme Play to Prevent; `docs/CONCEPT_BRIEF.md`). It replaces the document of 2026-10-31, which described the Godot prototype and is kept beside this one as `GDD-2026-10-31`. Game: <https://carlcrafterz.itch.io/gg-ez>, browser upload 20210294. Source: <https://github.com/CarlKho-Minerva/gg-ez>, branch `dev/full-html-campaign` at `414c4a1`.

How to read the evidence. Each factual sentence names its source in parentheses: a file in the repository, a card id from the scene tables (`early.json`, `act3.json`, `final.json` under `web/src/campaign/`), the fight code (`Campaign.ts`), a node in Dain's Figma file, or a measurement recorded in `web/VERIFICATION.md`, `docs/itch/SUBMISSION_LOG.md` and the JSON reports under `web/verification/`. Where status matters, a claim carries one of five words: measured (a script produced the number), tested (a check passed), storyboarded (written in a scene table), proposed (a plan), or not yet verified (nobody has checked). Every number is copied from those files.

The summary above is safe to read before playing. From section 1 on, this document describes the whole game, including the part the itch page keeps off the screen.

## 1. The game is the second press of the same two buttons

You lose an online fighting match by a hair. The stranger who beat you, lia_ph, types "ez". A chat box opens with two replies, "okay that was clean" and "fuck off", and a clock that starts at three seconds (`REPLIES` in `web/src/StoryScene.ts`; `choose()` there defaults to `seconds = 3`). Letting the clock run out is the third answer, recorded as "silence", a timeout and not a button (`Campaign.ts`, `matchChat()`).

The cruel reply is designed to be the easy one. The matches before the fair one are rigged: her health never drops below 18 of 100, the player's inputs are delayed, and once a hit has landed and 19 seconds have passed (30 seconds if none has) the player's own health drains at 26 points a second (`Campaign.ts`, `fight()`, lines 196, 244 and 298). In words: a full bar empties in under four seconds, so every rigged match ends close and ends badly. A player who presses nothing loses the first match at 30.8 seconds (measured, `web/verification/report.json`, `passiveOpening`).

After the third loss the controller cracks the monitor and the player is pulled through into her room. The chapters that follow show who typed "ez": a customer-care agent in Lapu-Lapu City, playing on her night-shift break (cards T.4 and A3, `early.json`). The player is a ghost that cannot touch anything or be seen (guardrails in `docs/storyboards/FINAL-SCENES-HTML-HANDOFF.md`; in the build the ghost is the wolf sprite at 50 percent opacity, `Campaign.ts` line 112). Then one more match, on a fair connection, and the same chat box.

That last box is the measurement. The opening chat (card 2.07) and the final chat (card E.1) are drawn by one function with the same coordinates, strings and clock (`matchChat()` calls `choose(REPLIES, 230, 420, id, 3, clock)` for both). Nothing on screen marks either button as right (storyboarded, cards M2.6 and E.1; the end card E.9 reads "No empathy score, no moral lesson"). What changes between the first press and the last is what the player knows about the person who typed "ez".

We make the narrow claim. A game about trash talk does not prevent radicalisation. It lets a player practise one pause, in a setting they already know, and shows them the same box twice. The organisers' PVE 101 webinar names harassment and toxicity as the leading sign that identity dynamics are hardening into us-versus-them (as summarised in `CONCEPT_BRIEF.md`; not re-checked for this document). The game stops at that first rung: nobody in it is recruited or confronted, and her worst line is two letters.

What the build records. At the credits it writes a finish record with the outcome, the three replies and the objects seen (`ending()`: `finish({completed, outcome, replies, seen, chapters: 13})`). It does not record how many milliseconds the player took to reply; `choose()` returns the pick and keeps no timestamp (verified in the code; the Godot prototype did record it). Nothing leaves the browser: the survey endpoint constant is empty, answers stay in browser storage under `gg-ez-survey`, and the only way out is a mail link the player taps (`SURVEY_ENDPOINT = ''`, `survey()`).

## 2. Four rigged matches, three before the room and one after, end by a hair; the fifth is fair

The fight is one function with five modes (`Campaign.ts`, `fight()`). Her skill rises each round: 0.3 in the opening, 0.55 in the rematch, 0.75 in the third match, 0.7 after the room, 0.8 in the final (line 163). In words: she gets sharper every time, and the final is the only round where the player's inputs are honest. What rigged means, from the code:

1. Input lag. In the opening, once the first hit has landed and the match is past 4 seconds, every press is delayed 0.5 seconds under a NETWORK DELAY banner (line 244); in the third match 0.45 seconds after two hits, with the callout INPUT: ATTACK (line 245). Presses made during lag are released 0.4 seconds later (line 222).
2. A floor under her health: never below 18 of 100 in a rigged round (line 196).
3. The drain of 26 health a second described in section 1 (line 298).
4. A late guard: in the second and third matches the block registers 0.4 seconds after the press and a parry is impossible (lines 187, 203, 247).

The final match removes all four. Her health is 150, there is no floor, drain or delay, and the banner reads CONNECTION STABLE (lines 163, 168, 177). It is capped at 40 seconds; at the cap the larger share of health left wins and a tie is a loss (lines 240, 306). The outcome depends only on the fight: `fight()` reads the mode and nothing else, and its comment says "Story flags never affect final combat" (line 157). The one story-dependent line in any fight is a hint in the second match chosen from the object the player saw (line 171); it changes text, not damage.

The moves (`web/README.md`; values from `fight()`). S dashes through her for 0.18 seconds, unhittable, with a 0.75-second cooldown (lines 201, 212). J strikes; three strikes inside half-second windows hit for 8, 9 and 15, the third launching her (lines 214, 218). K throws a crescent for 12 in rigged rounds and 10 in the final, and after two strikes K is a finisher at 1.7 times that (line 220). L held blocks at 4 or 5 chip damage a spell; a block pressed within 160 milliseconds before a hit is a parry that staggers her for 0.9 seconds (lines 203, 204). Lia closes, retreats, blinks, swings her staff for 15 to 19 depending on skill, casts for 22 in rigged rounds and 17 in the final, and in later rounds fires barrages of three (lines 267 to 292). She dodges a crescent with probability 0.9 times her skill (line 284). Hit freezes last 30 milliseconds on a strike, 60 on a launch and 240 on the finishing blow (lines 196, 306).

Measured balance (2026-11-01). A probe that only holds cast and block won four times out of four in 11.0 to 12.9 seconds with 15 hits each and 5 to 9 blocked spells; before tuning the same hold won in 6.8 seconds with 9 hits, which is why her health, dodge rate, chip damage and barrage rate went up (`VERIFICATION.md`, 02:25 entry; `tools/fight-probe.mjs`). In words: a player who presses two buttons still wins, but it takes twice as long as it did. The suite's real-keyboard final on the shipped package won in 10.3 seconds with 15 hits, 5 blocks and 0 parries (`report.json`); on the hosted itch frame, 14.1 seconds, 15 hits, 4 blocks (`hosted-report.json`). On the previous upload the same hosted fight was lost at 15.3 seconds with 14 hits and 9 blocks (`SUBMISSION_LOG.md`, 02:38 entry), so the fair fight is losable. Not yet verified: how the parry window and the shorter freezes feel to a person; the probe holds keys, it does not play.

## 3. Thirteen chapters, every one in the build

The campaign is a list of thirteen scene functions run in order (`Campaign.ts`, `run()`). Each chapter plays the cards of its scene table and marks each card id as it goes. The tables hold 109 cards: 40 in `early.json`, 29 in `act3.json`, 40 in `final.json`. The suite drives all six endings, two fight outcomes times three replies, and each route records 107 beats, a beat being one mark on the route taken (`report.json`; alternatives not taken are not marked). In words: the suite walks every chapter six times, once per ending. Figure 1 shows the order.

![Figure 1. The thirteen chapters in order: the kind of chapter (square, rigged fight; diamond, fair fight; circle, room scene the ghost observes; outlined square, title or chat), the table that holds its cards, and the measurements that exist for it from the 2026-11-01 suite and hosted runs. Chapter order is not elapsed play time.](fig-scene-clock.png)

| Chapter | What the player does | Cards | Board |
|---|---|---|---|
| 1 Matchmaking | Queues; matched with lia_ph, PHILIPPINES, CONNECTION UNSTABLE | 1.01 to 1.09, `Campaign.ts` | [33-2](https://www.figma.com/design/9n83sdzD1t2Fm3asaMi1Hs/GG-EZ?node-id=33-2) |
| 2 First match | Loses to lag and the drain; "ez"; three seconds, two replies | `fight('opening')`, chat 2.07 | [58-134](https://www.figma.com/design/9n83sdzD1t2Fm3asaMi1Hs/GG-EZ?node-id=58-134) |
| 3 Rematch | Loses to a clean punish; "same button again?" | L2.1 to L2.5, `early.json` | [77-134](https://www.figma.com/design/9n83sdzD1t2Fm3asaMi1Hs/GG-EZ?node-id=77-134) |
| 4 The connection | Inputs release together; "skill issue"; the pad spins into the monitor, the crack grows, the body is pulled through | L3.1 to T.9, `early.json`; `connection()` | [77-498](https://www.figma.com/design/9n83sdzD1t2Fm3asaMi1Hs/GG-EZ?node-id=77-498) |
| 5 The wrong room | 2:07 AM. Watches her replay the knockout and laugh; drifts to the badge, phone and dinner; any two of three open the way back | R.1 to N3, `early.json`; `Exploration.ts` line 60 | [78-621](https://www.figma.com/design/9n83sdzD1t2Fm3asaMi1Hs/GG-EZ?node-id=78-621) |
| 6 Second match | One inner line from what was seen; loses again; the same two buttons | M2.1 to M2.8, `act3.json` | [99-964](https://www.figma.com/design/9n83sdzD1t2Fm3asaMi1Hs/GG-EZ?node-id=99-964) |
| 7 The return | 2:31 AM. Same framing, four changes; the headset goes on | V2.1 to V2.6, `act3.json` | [99-1194](https://www.figma.com/design/9n83sdzD1t2Fm3asaMi1Hs/GG-EZ?node-id=99-1194) |
| 8 The call | A refund call from an angry customer; her QA score; what she could have said | C1.1 to C1.13, `act3.json` | [100-964](https://www.figma.com/design/9n83sdzD1t2Fm3asaMi1Hs/GG-EZ?node-id=100-964) |
| 9 Mama | Answers her mother about money after payday; photographs the adobo; the budget note | P.1 to P.9, `final.json` | [127-964](https://www.figma.com/design/9n83sdzD1t2Fm3asaMi1Hs/GG-EZ?node-id=127-964) |
| 10 Mika | Her friend asks about the movie she bailed on; "farming wins" | K.1 to K.6, `final.json` | [127-1031](https://www.figma.com/design/9n83sdzD1t2Fm3asaMi1Hs/GG-EZ?node-id=127-1031) |
| 11 The longest night | Four time stamps, 2:48 to 4:17, while the ghost floats freely; "Usa pa" | N.1 to N.6, `final.json` | [127-1080](https://www.figma.com/design/9n83sdzD1t2Fm3asaMi1Hs/GG-EZ?node-id=127-1080) |
| 12 A fair fight | CONNECTION STABLE; win or lose on the fight alone | F.1 to F.7, `final.json` | [127-1129](https://www.figma.com/design/9n83sdzD1t2Fm3asaMi1Hs/GG-EZ?node-id=127-1129) |
| 13 The last reply | The same chat; 4:25 AM; "Okay. Kaya pa."; the next call; END OF MATCH; three survey questions | E.1 to E.9, `final.json` | [127-1190](https://www.figma.com/design/9n83sdzD1t2Fm3asaMi1Hs/GG-EZ?node-id=127-1190) |

In words: the boards are Dain's editable Figma frames for scenes 1 to 8 (`docs/storyboards/ACT3-TABLES.md`) and the five tables added for scenes 9 to 13 (the handoff); the card ranges are what the running game marks.

Three story rules hold everywhere, each with a place in the code or the tables. The ghost observes and never intervenes (cards R.4, "ghost cannot affect Lia", and N3, "Queue causes return, not touch or empathy reward"). One faulty connection links both rooms: the crack reads CONNECTION LOST and "lia_ph is still there" (`connection()`), and her queueing pulls the ghost back (N3). Winning is independent of empathy: section 2 gives the line.

Timing of a run. The automated driver finishes all thirteen chapters on the packaged standalone file in 251.9 seconds (`VERIFICATION.md`, 00:51 build); it advances every line the instant it appears, so a person takes longer. The brief's "ten to fifteen minutes" is an estimate, not yet verified on a person.

## 4. Lia is competitive before she is sympathetic

Lia, lia_ph, lives in Lapu-Lapu City and takes customer calls remotely on a night shift, 9 PM to 6 AM with a break from 2:00 to 2:30 and QA coaching on Thursday (badge card A3; T.4 and T.9 for the city and 2:07 AM). She plays on the break, replays her own knockout and laughs (R.2 to R.4: "HAHAHA. Grabe.", "Sorry, whoever you are.", "Actually, not sorry."). Her register changes with the person: gamer slang to strangers ("bro just block", M2.3; "skill issue", L3.5), Cebuano to her mother and to herself (P.3, K.5, N.5, E.6, each with an English gloss under the balloon, `GLOSS` in `Campaign.ts`), scripted English to the customer (C1.3, C1.7). Her provocation is "ez", and after she loses the fair fight, "for you apparently" with a skull (F.6A). She keeps her friend waiting (K.2) and admits she was farming wins (K.4). Work explains her evening; the tables are written so it excuses nothing (handoff guardrail: "they do not turn her into a lesson").

The player is a username and a wolf, Dain's 32 by 37 pixel sprite (`web/public/assets/dain/wolf.png`, measured from the file header). The HUD says YOU and the build never gives the player a face; the body at the desk is a wolf-coded silhouette that card T.1 calls a continuity placeholder (proposed: finished protagonist art). The ghost is the wolf at 50 percent opacity with a teal tint (line 112); a drawn ghost form with the wolf's muzzle and ears and a tail for legs is the handoff's ask to Dain (asset id `ghost`; proposed, not in the build).

Dain's art (measured from the files in `web/public/assets/dain/`): arena 512 by 224; wizard 46 by 43; wolf 32 by 37; her spell 238 by 73; the crescent 41 by 32; the room 1280 by 565, a retrofit of her room drawing (`README.md`; her work-in-progress file of 2026-10-31 sits beside it), with Lia cut out as a 73 by 96 sprite that `RoomLia.ts` articulates into poses from a fixed set of cropped parts (`VERIFICATION.md`, hardening review); the adobo tub 46 by 24 close and 34 by 12 on the desk. The itch cover is her thumbnail at 630 by 500 (image 31669133, `SUBMISSION_LOG.md`). Every image in the package is hers; the Krea and Meshy art of October belongs to the archived Godot prototype (`CONCEPT_BRIEF.md`, `docs/itch/DESCRIPTION.md`). The poses the handoff asks her for next: `lia-phone`, `lia-photo`, `lia-lean-eyes-closed`, `lia-laugh`, `lia-quiet`, `lia-coffee`, `lia-stretch`, `lia-headset-off`, and the ghost (proposed; swapped in by asset id, no code change). Her file: <https://www.figma.com/design/9n83sdzD1t2Fm3asaMi1Hs/GG-EZ>.

## 5. Staging rules borrowed from SANABI, each with its place in the build

SANABI (WONDER POTION, published by NEOWIZ) is the composition reference. Its director, You Seung Hyeon, described a cycle of script, temporary art, in-game test, then animation and camera, and said closer framing intensifies a moment while wider framing creates distance (I.N.T interview, 2025-09-08, as summarised in `SANABI_DIRECTOR_RESEARCH.md` on the story branch; not re-read for this revision). The rules are our applications, not shots he prescribed. The reference screenshots are composition studies only, not GG EZ art or training data.

1. Establish the arena wide and keep it there: every fight is a fixed wide camera (`fight()` never moves it; cards L2.1 to L3.4).
2. Hold on the result and the chat; the two buttons dominate the same composition at the start and the end (`matchChat()`, one function for 2.07, M2.6 and E.1).
3. Cross through a matched frame and hear the fan before the room: the arcade loop stops at the smash (`connection()`, T.2) and card T.7 reads "Fan enters BEFORE room reveal".
4. Reveal the whole room first; her replay and joke come before any object can be read (R.1 to R.5 precede A1).
5. Repeat the camera position on visit two: V2.2 is the first-visit wide with four changes, the work app, the headset, the chair 18 pixels closer, both feet down (`act3.json`).
6. Hold after the call ends: C1.8 is a three-second hold with the typing sound stopped (`roomCards()`).
7. Keep the phone and the Mika chat in one frame with Lia; the phone panel is drawn beside her, never full screen (`phone()`; K.1).
8. Return to the exact opening chat (rule 2; E.1 keeps the win-branch message above the buttons).
9. End wide and let her life continue: E.3 to E.7 return to the first-visit wide, the headset goes back on, and she takes the next call before the fade (`ending()`).

## 6. Content on disk: what exists, what the code draws, what is still asked for

| Asset | Ask | In the build now | Status |
|---|---|---|---|
| Title screen | 1 | Text title and matchmaking cards | in build |
| Arena, fighters, spell, crescent | 1, 2, 2 | Dain's PNGs, sizes above | in build |
| Lia's room | 1 | `room-retrofitted.png`, 1280 by 565 | in build |
| Lia in the room | 6 poses | One sprite articulated by `RoomLia.ts` | placeholder; 8 poses proposed |
| Lia portraits | 5 | None; a balloon with a pointer replaces the portrait (handoff) | dropped by design |
| Ghost | 1 form | Wolf sprite at 50 percent opacity | placeholder; form proposed |
| Phone, work screens, controller, crack | 4 | Drawn by code: `phone()`, `document()`, `controller()`, six crack lines in five steps | in build |
| Effects, ambiences, music | 10, 3, 1 | 10 effects and 3 loops of 2026-10-28; a 20-second arcade loop | in build |
| Voice | Lia, caller | 22 Lia lines, 4 caller lines | in build; provenance below |
| Cinematic close-ups | 2 to 3 | None | not started |

In words: the two things the storyboard asked for that the build does not hold are drawn poses for Lia and a drawn ghost; everything else is a file of Dain's or a shape the code draws.

Sound and voice provenance (measured from `web/public/assets/audio/CREDITS.md`). The thirteen effects and ambiences are ElevenLabs sound effects of 2026-10-28, the 20-second arcade loop the same service on 2026-11-01. The four caller lines are the ElevenLabs stock voice Roger, model eleven v3. Lia's 22 lines are synthetic speech from the ElevenLabs Voice Library voice "Ate Marcela", a published Cebuano voice (locale ceb-PH, voice id `NL3wAdhrhsFZAoDTBMHk`), generated with eleven v3 on the team's ElevenLabs grant account on 2026-11-01, with the Cebuano language setting on the eleven lines that contain Cebuano; one voice for all 22 so Lia stays one speaker. The earlier Laura and Microsoft Blessica versions were replaced and are not in the build (source at `414c4a1`); upload 20210294 was packaged before this change (`VERIFICATION.md`, 10:00 entry), and the upload that carries the new lines is not yet recorded in `SUBMISSION_LOG.md`. No real person's voice was cloned by the team. All 40 clips decode, 144.76 seconds in total on the 10:00 package (`audio.json`). Not yet verified: a listening pass with a Cebuano ear; the voice's age tag (middle-aged) is the recorded compromise.

Saving and the survey. Progress saves at chapter boundaries under `gg-ez-save-v1` when storage is allowed, and Continue resumes it (`save()`, `readSave()`). After the credits: "In the three seconds after ez, what did you feel?", "If the box had been free text, would you have typed something worse?", and an optional line of 280 characters (`survey()`; tested through Send and Done, `VERIFICATION.md` 10:00). Self-report, kept on the device.

## 7. What is on itch, what was checked, what comes next

On the page (`SUBMISSION_LOG.md`, every id read back from itch after saving): browser build 20210294, ZIP SHA-256 beginning `6601d720253f`, 55 files, the only embed, 1280 by 720; the 2026-10-31 design document as upload 20210090; the concept and controls PDF v2 as 20210296; the narrated 70.6-second trailer cut from real play as 20210676 (narration by Microsoft's `en-PH-JamesNeural`); the earlier build 20200964, the Godot build 20115262 and the design notes 20198190 as archives. The jam entry, <https://itch.io/jam/checkpoint-game-jam/rate/5254371>, reads "6 hours, 19 minutes before the deadline"; the jam closed 2026-11-01 03:59:59 PST and the page stayed editable.

Checked on this build (tested, 2026-11-01, Chrome at 1280 by 720 through Playwright; commands in `web/README.md`). Campaign suite: six routes, 107 beats each, a real keyboard final and a real silence timer (`report.json`). Exploration suite: collision-only discovery, keyboard, pointer and scaled touch, the two-object lock, re-entry, reduced motion; ten 100-millisecond updates move the ghost 225 pixels and a simulated long pause at most 22.5 (`exploration-report.json`). In words: a tab left in the background cannot teleport the ghost when it comes back. Presentation: her footwork, one scaled body in the pull, room frames at a median of 4.2 milliseconds and 4.9 at the 95th percentile on the PC (`presentation-report.json`; an earlier headless run on a busy Mac measured 116.7 and 133.4). In words: on this PC the room draws in under five milliseconds of a 16.7-millisecond frame; on a phone, unknown. Hosted frame: bundle byte-identical to the local build, all six endings, the fight and silence numbers above, no page errors, no failed requests (`hosted-report.json`). Not yet verified: a person's playthrough of this exact upload; a physical phone.

After the jam, in order (proposed):

1. Record the reply time in milliseconds beside each pick, as the Godot prototype did.
2. Two reviews before the script locks: the Cebuano lines by an independent speaker, the call English by someone who has worked a Philippine BPO floor (business process outsourcing, the call-centre industry). The lines were drafted to Carl's Lapu-Lapu household voice and nobody else has read them (`CONCEPT_BRIEF.md`).
3. A listening pass on all 22 Ate Marcela lines, and the Jesi alternate set kept outside the repository for an ear test (`CREDITS.md`).
4. Dain's eight poses and the ghost form.
5. A human playtest on the fair fight, the parry window and the shorter freezes.
6. If selected for the two-month phase: a second opponent with a different life (`CONCEPT_BRIEF.md`).

## 8. Open questions and risks

The measure is small, and smaller than the prototype's. The build knows which of two buttons a player pressed three times and whether they won; it does not know how long they hesitated. A changed pick on the last chat says the player paused once, after a room designed to make them pause. It says nothing about the next day. The survey is self-report. No player study exists.

Language. Eleven of Lia's lines are Cebuano (`CREDITS.md`). The voice is a published Cebuano voice, but no Cebuano speaker outside the team has heard the lines, and the glosses under the balloons are the only guarantee the player understands them.

Registration. The jam form attests that both members registered individually; Dain's country is written as "to be confirmed by her" (`SUBMISSION_LOG.md`, open items). Neither has been independently validated.

Feel. Every balance number in section 2 came from a script that holds keys. The tuning moved the two-button win from 6.8 to about 12 seconds; whether that reads as fair to a person is not yet verified, as are the 30 to 60 millisecond freezes, shortened after the first upload felt heavy (`SUBMISSION_LOG.md`, morning update).

What changed since 2026-10-31. That document described a Godot prototype with a rage loop, Quezon City text, an older reply pair and a `GHOST = false` flag, and said the thirteen scenes were a production plan. All thirteen are now in the build, the city is Lapu-Lapu, the reply pair is the approved one, and the ghost is a sprite the player moves. The prototype is archived as upload 20115262 and its document as `GDD-2026-10-31`.

## AI use and credits

Design, code and writing: Carl Kho. Pixel art and design: Dain Kim. Claude (Anthropic) wrote most of the code and the dialogue drafts from the team's design sessions and the storyboard; the team edited them (`CONCEPT_BRIEF.md`). Engine: Phaser 3. Sound effects, the arcade loop, the caller's lines and Lia's lines: ElevenLabs, as recorded in `CREDITS.md`. Trailer narration: Microsoft `en-PH-JamesNeural`. The archived Godot prototype used art generated with Krea 2 Turbo and fighter models from Meshy; none of it is in this build. SANABI: WONDER POTION and NEOWIZ, composition study only. No UN names or emblems appear in the game. This document was drafted with Claude from the files it cites and edited by Carl; its PDF was rendered with pandoc and WeasyPrint by `tools/render_gdd.sh`.
