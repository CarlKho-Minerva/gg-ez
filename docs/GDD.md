# GG EZ Game Design Document

Carl Kho and Dain Kim. Written 2026-10-31 for the Checkpoint Game Jam 2026 submission (theme: Play to Prevent). Godot 4.7, one script (`main.gd`). Source: https://github.com/CarlKho-Minerva/gg-ez. This document describes what is in the build, what is storyboarded, and what is not started. It does not claim anything is implemented beyond what `HANDOFF.md` records.

## 1. What the game is and what it is for

You lose an online fighting match by a hair. The stranger who beat you types "ez". A chat box opens with two replies and a three-second clock. Most people press the cruel one. That reflex is the whole subject of the game.

GG EZ is a short browser game about the first rung of online hostility: the fast, automatic insult at whoever is nearest when something goes wrong. Nobody in it is recruited or radicalised. The jam's design resource defines a checkpoint as a gameplay intervention that interrupts a harmful path and shifts the player's perspective. Ours is not the moment the player crosses into the other person's room. It is the moment the same two buttons come back after they have been there.

That is also the measurement. The opening chat and the closing chat use the same crop, the same scale, the same wording and the same clock. The two replies are "okay that was clean" and "fuck off", and letting the clock run out is the third answer, silence. The game records which one the player picked and how many milliseconds it took, every time. Nothing on screen marks either button as right. What changes between the first press and the last is only what the player knows about the person who typed "ez".

We make the narrow claim, not the wide one. A game about trash talk does not prevent radicalisation. It lets a player practise one pause, in a setting they already know, and it shows them their own before-and-after.

## 2. The loop that is playable now

The build is a rage loop. One run takes a few minutes. The tunables are the constants at the top of `main.gd`, named in parentheses below. The self-playing test run (`godot --path . -- --autoplay`) verified the loop end to end at the commit `HANDOFF.md` records.

1. A 30-second match (`MATCH_TIME`). Side-view arena, keyboard: move, jump, swing. Both fighters carry a damage percentage; the player's hits land for 9 to 14 percent. Once she passes 90 percent, three rigs fire once each: the player's next swing in range whiffs (swings through empty air), the next input lags by 0.45 seconds, and she charges a finisher the player cannot survive. If she never reaches 90, the timer ends it. Her percentage turns red past 90 so the player can see how close it was.
2. KO. She types "ez" (or "gg ez", or "lol ez"). The reply window opens for 3 seconds (`REPLY_WINDOW`) with a countdown. No pick is logged as "said nothing" at 3000 ms.
3. The defeat card offers REMATCH. After three losses since the last room visit (`RAGE_AFTER`) a RAGE QUIT button appears beside it. After five (`FORCED_AFTER`) the controller flies on its own.
4. Rage quit is one animation: the controller hits the screen, the screen cracks, the crack opens onto her room. The first visit shows the phone and two objects; each later visit adds one hotspot (a thing in the room the player clicks to read one line about it): monitor, phone, lanyard, noodles, a note on the wall, the electric fan. A "log off" button in the room ends the game.
5. Her side: her portrait, her screen with what the player actually typed, then "queue again". Back to step 1 with the same two replies.
6. End conditions: two nice replies in a row once the player has seen the room at least once (`nice_streak`, `visits`), or eight losses (`MAX_LOSSES`), or log off. The end card lists every loss with the pick and the reply time, or "rage quit". Then a three-question feedback form.

The first nice reply "could not be sent" and does not count toward the streak.

What is logged. Every event goes through one function, `_track`: `start`, `queue`, `ko` (loss number, both damage values, match length), `choice` (pick, reply time in ms, loss number), `rematch`, `rage_quit` (loss number, losses since the room, whether it was forced), `look` (which hotspot), `logoff`, `result` (total losses, every pick, visits, the end reason, the whole loop array) and `feedback`. Each line is appended to a local file (`user://feedback.jsonl` on the player's machine) and, when a project key is set, sent to PostHog, a product analytics service, under a per-session id. Nothing a player types is shown to another person.

Two things in the build differ from the story decisions in section 3: the reply buttons still read "wow, you're good" and "fuck you", the pair the storyboard replaced on 2026-10-31, and the room text is Quezon City and Tagalog. Both are listed in section 8.

## 3. The five-act story and the supernatural rule

The production bible is the recovered Complete Game Storyboard v0.3: thirteen scenes in five acts, two locations, about 15 to 18 minutes. The build plays the first act and a loop built from it. The rest exists as storyboard tables and, for eight of them, as editable grayboxes in Figma (a rough layout in plain grey shapes, with the camera, action and sound written on each frame).

Three story rules hold everywhere.

The ghost is invisible and intangible. It moves, watches and passes through objects. It cannot touch anything, speak to Lia, or change her circumstances. She never knows it is there.

The fighting game and the bedroom share one faulty connection. A broken screen sends the player into Lia's room. When she queues for another match, the same connection pulls them back. No afterlife, no portal lore; a bad connection that goes somewhere.

Winning is independent of empathy. The player can win or lose the final match regardless of what they saw. Understanding Lia is not a power-up.

| Scene | What the player does | What it establishes | Status |
|---|---|---|---|
| 1 Title screen | Presses Start; watches matchmaking find lia_ph, region PH, ping 248 ms | A bright arcade game that promises nothing serious | Partly playable (title, username, queue); grayboxed, [node 33-2](https://www.figma.com/design/9n83sdzD1t2Fm3asaMi1Hs/GG-EZ?node-id=33-2) |
| 2 The first humiliation | Lands one hit, then loses to a freeze and late guard; three seconds, two replies | The loss feels like a bad connection, not a broken game | Playable now; grayboxed, [node 58-134](https://www.figma.com/design/9n83sdzD1t2Fm3asaMi1Hs/GG-EZ?node-id=58-134) and loss 2, [node 77-134](https://www.figma.com/design/9n83sdzD1t2Fm3asaMi1Hs/GG-EZ?node-id=77-134) |
| 3 The broken screen | Mashes through absurd lag; the controller flies; the crack opens | The crossing; sound changes from arcade to fan before the room shows | Playable now (rage quit, crack, reveal); grayboxed with the vacuum and replay, [node 77-498](https://www.figma.com/design/9n83sdzD1t2Fm3asaMi1Hs/GG-EZ?node-id=77-498) |
| 4 The wrong room | Floats for the first time; watches Lia replay the knockout and laugh | Lia is funny and irritating before she is anything else | Room reveal playable, no ghost, no replay beat; grayboxed in node 77-498 |
| 5 The first exploration | Reads any two of three objects: badge, phone, food | Employment, responsibility, personality, in any order | Hotspots playable (six, one more per visit); grayboxed, [node 78-621](https://www.figma.com/design/9n83sdzD1t2Fm3asaMi1Hs/GG-EZ?node-id=78-621) |
| 6 The second match | Loses again; one inner line varies by what they saw; same two replies | Knowing does not make losing easier | Rematch loop playable (without the inner line); grayboxed, [node 99-964](https://www.figma.com/design/9n83sdzD1t2Fm3asaMi1Hs/GG-EZ?node-id=99-964) |
| 7 The return | Falls gently back; same framing, four changes; the headset goes on | The same person now sounds completely different | Not in build; grayboxed, [node 99-1194](https://www.figma.com/design/9n83sdzD1t2Fm3asaMi1Hs/GG-EZ?node-id=99-1194) |
| 8 The call | Watches Lia take a refund call from an angry customer, then read her own QA score | The scene to protect: "ez" against "I understand why you're frustrated" | Not in build; grayboxed, [node 100-964](https://www.figma.com/design/9n83sdzD1t2Fm3asaMi1Hs/GG-EZ?node-id=100-964) |
| 9 The message home | Lingers while she answers her mother and photographs her dinner | People she cares about; the lean-back gesture repeated with its meaning changed | Not started |
| 10 "One more game" | Reads the chat with Mika, her friend | She is loved, funny, and sometimes selfish | Not started |
| 11 The longest night | Floats around the room while her shift passes in four time stamps | Quiet; the ghost goes toward the light willingly | Not started |
| 12 A fair fight | Plays a match with a stable connection, three exchanges, win or lose | Her skill is real; the connection, not empathy, got better | Not started (the build's match is always rigged) |
| 13 The last reply | The same chat, the same two buttons, three seconds; then the "Good morning" epilogue | No score, no label; the player reads their own behaviour | End card playable; storyboard ending not started |

The shorter three-match adaptation (three matches, two visits) is kept as history. It made two decisions that stay: Lapu-Lapu City, and Cebuano at home with an English gloss under every line. Quezon City and Tagalog remain only in the archived source text and must not be relabelled.

## 4. Characters

Lia (lia_ph). Lapu-Lapu City, a customer-care agent in BPO (business process outsourcing, the Philippine call-centre industry) on a remote night shift. She plays during her scheduled break. She is good at the game and knows it. She is funny, competitive, a little obnoxious, and she keeps a friend waiting. Work pressure explains her evening; it does not excuse every action. Her register changes with the person: gamer slang to strangers, Cebuano to her mother and landlady, scripted English to customers. She is never cruel; her whole provocation is two letters.

The player. A username with a controller. In the arena they are the wolf (Dain's sprite); Lia's fighter is the wizard. The build's text calls the player "you" and never gives them a face. Their only characterisation is what they press.

The ghost. What the player becomes on the other side of the crack: a small floating shape with the wolf's muzzle and ears, legs replaced by a tail. In the grayboxes it is the wolf sprite at 55 percent opacity until a finished ghost form exists. It needs five animations: float, turn, startled, angry, idle.

Dain's art pipeline. Dain draws the characters and the arena; her style is soft and warm. The storyboard grayboxes are built from her wolf, wizard, arena background and spell-effect sprites. The build's art came another way, to have something playable on 2026-10-28: Krea 2 Turbo (an open-weights image model, run locally) generated the portraits, the room and the first fighter sprites, and the latest commits render two rigged 3D fighter models (from Meshy, a text-to-3D service) into the sprites. Dain's drawn sprites are meant to replace the generated ones. The v0.3 sheet asks for five Lia portrait expressions (smug, laughing, professional, exhausted, quiet smile) and six small Lia animations (sitting, gaming, celebrating, eating, adjusting the headset, leaning back). No walk cycle is needed.

## 5. Staging rules borrowed from SANABI

SANABI (WONDER POTION, published by NEOWIZ) is the model for how the story is staged. Its director, You Seung Hyeon, described a cycle of script, temporary art, in-game test, then animation and camera, and said closer framing intensifies a moment while wider framing creates distance (I.N.T interview, 2025-09-08). The rules below are our applications of that, not shots he prescribed; the full notes are in `SANABI_DIRECTOR_RESEARCH.md` in the story branch.

1. Establish the arena wide. Move closer only as the frustration becomes the subject.
2. Hold on the result and chat. The two buttons dominate the same composition at the start and the end.
3. Cross through a matched frame. Both monitors sit in the same part of the image across the transition; the fan is heard before the room is seen.
4. Reveal the whole room first. Her joke and her failed clip come before any work or hardship detail.
5. Repeat the camera position on visit two. Posture and a professional voice change the meaning before the camera moves.
6. Slow push after the call ends. Let the silence land. No melodramatic move on every line.
7. Keep the dinner joke, the voice note and the Mika chat in the room, in one frame with Lia. No flashbacks.
8. Return to the exact opening chat. Same crop, scale, buttons, timing. Do not announce the right answer with a new visual language.
9. End wide and let her life continue. A polite reply does not fix her night.

The reference screenshots are composition studies only, credited to WONDER POTION and NEOWIZ, not training data or GG EZ art.

## 6. Systems and content budget

The v0.3 bible argues that a small set of reusable assets carries the whole story. The table adds what the build holds today.

| Asset | Quantity | Priority | In the build now |
|---|---|---|---|
| Title screen | 1 | Essential | Yes (text title; the v0.3 arcade menu is grayboxed) |
| Fighting arena background | 1 | Essential | Yes (`bg-arena.png`) |
| Fighting character sprites | 2 | Essential | Yes (generated; Dain's wolf and wizard to replace them) |
| Lia bedroom background | 1 | Essential | Yes (`room-reveal.png`, Quezon City text) |
| Lia portrait expressions | 5 | Essential | 2 (neutral, sad) |
| Lia sprite animations | 6 | Essential | None |
| Ghost sprite animations | 4 to 5 | Essential | None |
| Phone and work UI overlays | 2 | Essential | Phone only |
| Screen-crack transition | 1 | Essential | Yes (`crack.png`, drawn by script) |
| Arcade, ambient and call audio loops | 3 | Essential | 3 loops (street, CRT hum, her room); no call loop |
| Cinematic close-up illustrations | 2 to 3 | Optional | None |

Palette: vivid magenta and cyan for combat, warm amber with muted blues for the bedroom, cooler monitor light for the work sequence. The room never goes colourless when the story turns serious; it is still her home.

Sound. Thirteen short effects generated with ElevenLabs from prompts written for this game (swing, whiff, hit, blast, ko, chat, type, queue, smash, phone, room, crt, street), plus the three loops. The arcade music cuts off mid-beat at the crossing and the fan comes in first.

Logging. Section 2 lists the events. Each loop entry holds the pick, the reply time and whether the player rage quit, so a single run already contains its own before-and-after. PostHog receives the same events as `gg_<event>` when `POSTHOG_KEY` is set; today it is empty, so events stay on the player's machine.

## 7. What this jam submission contains and the roadmap after it

Submitted on itch.io: the web build (`gg-ez-web-final.zip`, single-threaded export, 1280 by 720), the concept brief as a PDF, and a two-minute trailer of real footage from the self-playing run. This document lives in the repository as `docs/GDD.md`. The build is a partial play of the story: Act I and the rage loop, with the room, the phone and the same-two-replies rematch. Acts II to V are storyboarded in v0.3, and scenes 1 to 8 are grayboxed in Figma with per-frame camera, action, sound and duration values that Dain can edit.

After the jam, in order:

1. Move the build to the story's decisions: Lapu-Lapu City, Cebuano phone lines with English gloss, the approved reply pair, `GHOST = true`.
2. Build scene 7 and scene 8 from the grayboxes. Scene 8 is the one scene to keep if half the game is cut.
3. Replace the generated art with Dain's sprites, portraits and the ghost.
4. Scenes 9 to 13, then the fair final match with its own win and loss branches and the six ending variations that share one epilogue.
5. If the project is selected for the two-month phase: a second opponent with a different life, voice for Lia's lines, and a short before-and-after quiz alongside the logged replies.

## 8. Open questions and risks

Language review. The Cebuano lines are new draft copy with English glosses, tuned to Carl's Lapu-Lapu household voice. No independent speaker has reviewed them, and nobody who has worked a Philippine BPO floor has checked the customer-call English. Both reviews are owed before the script locks; the v0.3 bible says they decide whether Lia is a specific person or a generic hardship.

The build and the story disagree in three places. `GHOST` is `false`, so the build's crossing is "the camera shows the other side", not the ghost; the room text is Quezon City and Tagalog; the reply buttons are the older pair. Each is a constant or a string in `main.gd`. None has been changed, because the story documents were not allowed to silently rewrite the runtime.

`POSTHOG_KEY` is empty. Every event stays on the player's machine, so the jam build measures nothing beyond it. Setting the public project key is one line.

The measure is small. A changed pick on loop five says the player paused once, after a room designed to make them pause. It says nothing about the next day, and the feedback form is self-report. The page and the brief should say so rather than let a logged number stand in for impact.

Feel. The 2026-10-28 note was "too fast, reads like a movie". The loop structure addresses that; the match itself still wants a human pass. Dain has not yet seen the current build; the grayboxes are the handoff.

## AI use and credits

Code drafted with Claude (Anthropic), edited by the team. Art in the build generated locally with Krea 2 Turbo and cut out by script; fighter models from Meshy. Sound effects generated with ElevenLabs. Intro footage: three Pexels clips, pixelised with ffmpeg. The storyboard v0.3 was drafted in a ChatGPT conversation and recovered verbatim; this document was drafted with Claude from the repository and the story branch and edited by Carl. SANABI references: WONDER POTION and NEOWIZ, composition study only.
