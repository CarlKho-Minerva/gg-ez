# GG EZ — the last five scenes, ready to graybox

Status: proposed tables for Carl and Dain to review. This handoff does not create grayboxes, complete runtime scenes or replace the public build.

Build the replacement in **HTML + TypeScript + Phaser**, using the existing `dev/web` scaffold. The current itch game stays live until a separate candidate passes a complete beginning-to-end playthrough and its branches. No Godot work is needed for this handoff.

The story remains Lapu-Lapu City, with Cebuano home dialogue and English customer calls. Cebuano lines below are adaptation drafts for Carl to tune. The v0.3 archive remains unchanged. Plain boxes and existing art are enough to block every card below.

## Split the work once

| Owner | Concrete work | Handoff |
|---|---|---|
| Dain | Reusable Lia poses, ghost form and room/prop art in the existing Figma file. Start with phone, lean-back eyes closed, headset and stretch. | Name PNGs by asset ID below; transparent character/prop backgrounds; keep scale and anchors consistent. Static poses are sufficient for the first complete pass. |
| Carl | Review these tables, tune the Bisaya, check Lia's humor and pacing, and play the opening and ending with the same reply choices. | Comments by card ID, e.g. P.9 or K.5. Choose where a line needs more silence. |
| Codex | HTML scene wiring, input, camera, bubbles, timers, state, branch tests and a separate itch-ready candidate ZIP. | One scene module per scene ID. Graybox missing art immediately; swap asset files when Dain's work lands. |

A Figma card becomes one runtime beat: `mark(cardId)` records it, a short movement plays, readable dialogue waits for the player, and `finish(result)` hands state back to the campaign. Dain should not redraw the room five times. Carl and Dain can revise poses and words while the same scene modules keep running.

## Guardrails that carry the taste

- Establish the full room before close details. Keep the fan, food, phone, desk and Lia spatially consistent.
- Use a short balloon above Lia with a pointer following her head. Let hands and pauses carry the feeling. No new portrait panel is needed.
- Keep her funny and occasionally selfish. Work and family supply context; they do not turn her into a lesson.
- Reuse the victory lean for P.9, with eyes closed and a longer hold. Reuse the first-arrival room wide for E.3.
- The invisible ghost observes and floats. It never moves Lia's objects or makes her act.
- Final combat is responsive. The player's discoveries and reply history never alter the winner.
- Opening and final chat reuse the exact component: **okay that was clean / fuck off**, three seconds; silence is timeout, not a third button. Keep choice and response time separately from combat result. Show no moral score.

## Remaining 4 h 50 min: proposed checkpoints

These are work targets, not a claim the candidate is finished.

| Elapsed from this handoff | Codex / runtime | Dain | Carl |
|---|---|---|---|
| 0:00–0:20 | Lock scene IDs and state; make the campaign able to reach a placeholder END OF MATCH. | Reuse/export current arena, room, characters; start priority poses. | Review tables and draft ending replies. |
| 0:20–2:10 | Finish the existing eight sets and connect scenes 9–11 in graybox; use existing text and art. | Phone, quiet lean, headset, stretch; native shapes cover remaining props. | Play the room and call; tune Bisaya by card ID. |
| 2:10–3:25 | Responsive final fight, actual win/loss, final reply branches and shared epilogue. | Replace the highest-impact placeholders first. | Check the repeated chat and the lean-back callback. |
| 3:25–4:15 | Whole-route browser tests, all six ending combinations, silence, restart and hosting subpath. | Correct clipping/scale; stop adding new assets. | Human end-to-end pass; report only blockers. |
| 4:15–4:50 | Package separate candidate, verify its hosted page, fix blockers; release only when the end-to-end gate passes. | Final asset fixes only. | Confirm candidate is ready. Current game remains the fallback. |

## Scene 9 — Mama and the phone (`p9`)

**Dain:** Phone-in-hand, photo gesture, bay leaf, eyes-closed lean. Reuse the existing chair, desk, food and room.

**HTML:** Phone bubbles, camera brackets, sent tick and grounded budget-note hotspot. End on the exact earlier victory lean, eyes closed.

**Asset IDs:** `lia-phone`, `lia-photo`, `lia-lean-eyes-closed`, `phone`, `food`, `bay-leaf`

| Card | Exact text / visible UI | Action and camera | Timing / input | Graybox pieces |
|---|---|---|---|---|
| P.1 · AFTER-CALL WORK | Screen: AFTER-CALL WORK | The status flips from AVAILABLE to AFTER-CALL WORK. Lia's hand leaves the mouse and reaches for the phone face-up beside the keyboard. The ghost drifts a little closer to the desk. Camera: Medium over the desk, same crop as the end of the call | 0.8 s; Cinematic | Existing medium room; work-monitor status label; Lia hand and phone rectangles. |
| P.2 · The message is still there | Screen: Mama ❤️<br>Earlier tonight<br>Nak, nakapadala na ka?<br>Bisan Friday na lang. Amping. | Phone close-up fills the right half of the frame. The thread with Mama ❤️ shows the two messages from the first visit, unanswered since 2:07. Her thumb hovers. Camera: Phone crop; her face stays at the left edge | 1 s hold; Cinematic | Phone panel anchored beside Lia: header, two received bubbles, thumb rectangle. |
| P.3 · She types | Screen: Ma, Friday pa akong sweldo. Padala ko after.<br>Nikaon na pud ko hehe | Two bubbles appear on her side with a 0.6 s gap: 'Ma, Friday pa akong sweldo. Padala ko after.' then 'Nikaon na pud ko hehe'. Gloss under the phone: Ma, payday is Friday. I'll send after. / I've eaten too hehe. Camera: Phone crop | 0.6 s between bubbles; Cinematic | Same phone; two outgoing bubbles, revealed one at a time. |
| P.4 · A photo of the container | — | She lifts the phone over the desk; a camera frame appears over the almost-empty adobo container, rice grains and the spoon. Shutter. Camera: Medium; the camera frame drawn over the desk | 0.8 s; Cinematic | Same desk; phone rectangle above food; four camera-corner lines. |
| P.5 · Naay gulay. Technically. | Lia: Naay gulay. Technically. | Her spoon tips the bay leaf into view inside the camera frame. Balloon above her. Small smile, no laugh. Camera: Same medium crop | Line hold; Cinematic | Spoon line and leaf ellipse above the food; speech balloon points to Lia. |
| P.6 · Sent | Screen: [photo: adobo container, one bay leaf]<br>Sent ✓ | The photo bubble lands in the thread. Delivered tick. Camera: Phone crop | 0.5 s; Cinematic | Phone photo bubble drawn as food container + rice + one leaf; Sent tick. |
| P.7 · Her mother's earlier line | Screen: MAMA: Ayaw pasagdi imong kaugalingon, nak. | The thread scrolls so Mama's earlier line sits above the photo. Lia reads it and does not type. Gloss: Take care of yourself, child. Hold. Camera: Phone crop, then a slow pull back toward medium | 1.5 s hold; Cinematic | Reuse thread; earlier Mama bubble scrolls into view beside Lia. |
| P.8 · The budget note | Screen: RENT · KURYENTE · GROCERY<br>TRANSPO (onsite days)<br>PADALA SA BALAY: Friday | Observe on the desk: a small handwritten note beside the phone. Ordinary lines: rent, electricity, groceries, transport for onsite days, the planned transfer home. No close-up of a wallet, no music cue. Camera: Close on the note, the phone still in frame | Player read hold; Observe only; free to linger | Small paper rectangle on the desk with expense lines; phone stays in crop. |
| P.9 · The same lean, eyes closed | — | Lia leans back in the chair exactly as she did after the knockout replay (same angle, same arms), but this time she closes her eyes. The ghost floats beside the chair. Nothing else moves. Camera: Wide; hold 3 s; identical framing to the first visit's lean-back card | 3 s hold; Cinematic | Clone earlier lean-back pose and room framing; change only eyes and timing. |

**Exit:** Mother thread and photo sent; budget note is optional; one deliberate lean-back hold before Mika.

**Sound:** One soft status chime; fan; Screen tap; Two send blips; Phone shutter; Spoon tap; Send blip; Fan only; Fan; Fan; no music. Reuse existing cues; missing cues may stay silent for graybox.


## Scene 10 · Mika: one more game (`k10`)

**Dain:** One laugh pose and a small quiet seated pose. Reuse phone and room; Mika needs no portrait.

**HTML:** Message bubbles in sequence, type/delete beat, small spoken balloon, then work status. Player advances after each readable exchange.

**Asset IDs:** `lia-phone`, `lia-laugh`, `lia-quiet`, `phone`

| Card | Exact text / visible UI | Action and camera | Timing / input | Graybox pieces |
|---|---|---|---|---|
| K.1 · buhi pa ka? | Screen: MIKA: buhi pa ka?<br>LIA: unfortunately | A new thread lights up: Mika. Her reply is instant. Two-person composition: the phone and Lia's face share the frame. Camera: Phone and face together (SANABI direction 10) | 0.8 s; Cinematic | Reuse phone + Lia medium crop, two chat bubbles. |
| K.2 · movie later? | Screen: MIKA: movie later? you bailed last time<br>LIA: after shift promise<br>MIKA: that's what you said last time | Three bubbles in turn, 0.7 s apart. Lia's typing is quick; Mika's last line lands and she stops. Camera: Phone and face | 0.7 s per bubble; Cinematic | Same crop and phone panel; three successive chat bubbles. |
| K.3 · Types, deletes, types again | Screen: LIA: i was\|<br>(deleted)<br>LIA: \| | A typing indicator starts, the draft 'i was' appears, is deleted character by character, then the cursor blinks alone for 1 s. Camera: Phone crop | 2 s; Cinematic | Draft text and blinking caret inside input field, erased in place. |
| K.4 · farming wins | Screen: LIA: okay fine i was farming wins 😭<br>MIKA: farming enemies more like<br>LIA: character development<br>MIKA: yours or theirs? | Four bubbles, 0.7 s apart. On the last one Lia laughs once, shoulders bounce, the ghost's ears lift slightly. Camera: Phone and face | 0.7 s per bubble; Cinematic | Four bubbles in the same phone, one small shoulder-bounce pose. |
| K.5 · At least sa game | Lia: At least sa game, kabalo ko nga maayo ko. | She goes quiet. The line is said to herself, small balloon, no portrait, eyes on the dark phone. Gloss under the balloon: At least in the game, I know I'm good at something. Hold. Camera: Medium, no move | 2 s hold; Cinematic | Lia seated, phone dim; small balloon above her, no portrait overlay. |
| K.6 · Back to the queue | Screen: STATUS: AVAILABLE<br>NEXT BREAK 4:17 | She checks the clock, puts the phone face-down, and clicks AVAILABLE. Her next break is a long way off. Camera: Medium | 1 s; Leads into the time passage | Phone face down; work-monitor AVAILABLE / NEXT BREAK 4:17. |

**Exit:** Phone is put down; AVAILABLE; next break 4:17.

**Sound:** Message ping, reply blip; Pings and blips; Key taps, backspace taps; Pings, one short laugh; Fan only; Click. Reuse existing cues; missing cues may stay silent for graybox.


## Scene 11 · The longest night (`t11`)

**Dain:** Coffee sip, shoulder stretch and headset-off pose. Reuse the same fixed room composition.

**HTML:** Four time/status changes while ghost movement stays live; a voluntary drift toward the monitor at the final break.

**Asset IDs:** `lia-coffee`, `lia-stretch`, `lia-headset-off`, `mug`, `ghost`

| Card | Exact text / visible UI | Action and camera | Timing / input | Graybox pieces |
|---|---|---|---|---|
| N.1 · 2:48 AM | Screen: CALL 00:04<br>Overlay: 2:48 AM | Wide room. A call connects; she answers in work voice (no balloon, murmur only). The player can float the ghost anywhere during this scene; the room keeps changing behind it. Camera: Wide, fixed; the player moves inside it | Player-paced, 3 s minimum; Free movement; observe available | Same room wide; clock 2:48 AM; CALL status; movable ghost. |
| N.2 · 3:19 AM | Overlay: 3:19 AM | Same framing. She takes a sip of lukewarm coffee and grimaces slightly; the mug goes back beside the keyboard. Camera: Wide, fixed | 3 s minimum; Free movement | Same room; clock 3:19 AM; mug rectangle follows Lia hand. |
| N.3 · 3:52 AM | Overlay: 3:52 AM | She stretches her shoulders, arms up, and looks at the clock on the work app. Returns to the keyboard. Camera: Wide, fixed | 3 s minimum; Free movement | Same room; clock 3:52 AM; simple raised-arm stretch pose. |
| N.4 · 4:17 AM, BREAK | Screen: STATUS: BREAK<br>Overlay: 4:17 AM | Status flips to BREAK. She removes the headset and hangs it on the hook. The room becomes quiet: the call murmur stops, only the fan. Camera: Wide, fixed | 2 s; Free movement | Same room; clock 4:17 AM; headset moves from head to hook. |
| N.5 · Usa pa. | Lia: Usa pa.<br>Screen: GG EZ · QUEUE | She opens the fighting game. The familiar music starts faintly from the monitor. Balloon: Usa pa. Gloss: One more. Camera: Medium on her and the monitor | Line hold; Cinematic | Medium on Lia and monitor; game window + queue button; balloon. |
| N.6 · Toward the light | — | The ghost turns to the monitor. The screen begins to glow white. For the first time the ghost does not brace or flinch; it floats toward the light on its own, tail last. Cut to the arena. Camera: Medium, then a cut | 1.5 s; Cinematic | Monitor glow rectangle; ghost moves head-first toward aperture. |

**Exit:** BREAK at 4:17; Lia queues; ghost floats head-first toward the monitor, tail last.

**Sound:** Faint call murmur, fan; Mug set down; Chair creak; Headset click on the hook; murmur stops; Arena music, faint, from the monitor speaker; Music rises; soft suction, gentle. Reuse existing cues; missing cues may stay silent for graybox.


## Scene 12 · A fair fight (`f12`)

**Dain:** Existing arena, wolf, wizard, cyan spell and crescent. A gray guard slab is sufficient.

**HTML:** Responsive movement/attack/block; earned win or loss from combat. No discovery or reply variable enters damage, health or outcome.

**Asset IDs:** `arena-bg`, `wolf`, `lia-wizard`, `lia-spell`, `wolf-crescent`

| Card | Exact text / visible UI | Action and camera | Timing / input | Graybox pieces |
|---|---|---|---|---|
| F.1 · CONNECTION: STABLE | Overlay: OPPONENT: lia_ph<br>CONNECTION: STABLE | The arena loads with the same music. Two lines in the top band, the second one new: CONNECTION: STABLE. No explanation offered. Camera: Fixed wide, Scene 2 framing | 1.2 s; Match begins on advance | Existing arena/HUD; OPPONENT: lia_ph / CONNECTION: STABLE. |
| F.2 · Your block works | — | Her spell comes; the player presses block and the guard appears on the same frame. The spell breaks on it. The wolf is not pushed. Camera: Fixed wide | 0.4 s; Full control from here; inputs respond immediately | Existing spell and wolf; guard rectangle in front of wolf, immediate. |
| F.3 · Exchange one | — | Lia catches one of your dodges with the cyan spell; you land a strong crescent counter that pushes her back to the left edge. Both health bars drop. Camera: Fixed wide | 2 s of play; Real exchange, not scripted | Existing wizard, spell, wolf and crescent; two health bars. |
| F.4 · Exchange two | — | Both fighters damaged; she is still genuinely skilled. Neither is guaranteed the win. The match continues under player control. Camera: Fixed wide | Up to 20 s; Full control | Same combat scene; live movement, attacks and defense. |
| F.5 · Final stock | — | The last hit lands one way or the other. For a fraction of a second the game is silent. Camera: Fixed wide; hit stop | 0.3 s; Outcome decided by play | Same arena; freeze on actual finishing hit for 0.3 s. |
| F.6A · ALTERNATIVE A: VICTORY | Chat: lia_ph: ez<br>lia_ph: for you apparently 💀<br>Overlay: VICTORY | VICTORY drops in. Lia types ez, then a second message 0.8 s later: for you apparently 💀. She is being sarcastic about her own loss. Camera: Result hold | Hold until advance; Advance after read | Same arena; VICTORY and two sequential Lia messages. |
| F.6B · ALTERNATIVE B: DEFEAT | Chat: lia_ph: ez<br>Overlay: DEFEAT | DEFEAT drops in. lia_ph: ez. No apology. No sudden friendship. Just Lia. Camera: Result hold | Hold until advance; Advance after read | Same arena; DEFEAT and Lia ez message. |
| F.7 · We stay in the game | Chat: lia_ph | No cut to her room. The result fades; her username stays on the dark arena. The player has to remember the person behind it themselves. Camera: Fixed; nothing moves for 2 s | 2 s; Cinematic | Same arena goes dark; preserve username and actual message history. |

**Exit:** Exactly one result, then carry the actual Lia chat history to scene 13 without cutting to the room.

**Sound:** Arena music, full; Guard clack, spell fizzle; Spell hit, crescent hit; Music, hits; Silence for 0.3 s; Win sting, two pings; GAME, one ping; Music fades to a low hum. Reuse existing cues; missing cues may stay silent for graybox.


## Scene 13 · Three seconds / Good morning (`e13`)

**Dain:** Reuse room wide, stretch, headset adjustment and cracked player monitor. One closed-eye/quiet pose is enough.

**HTML:** Reuse opening chat component unchanged, real 3-second clock, three reply branches × two combat results, shared epilogue and restart.

**Asset IDs:** `room`, `lia-stretch`, `lia-headset-on`, `phone`, `cracked-monitor`

| Card | Exact text / visible UI | Action and camera | Timing / input | Graybox pieces |
|---|---|---|---|---|
| E.1 · Only the chat remains | Chat: lia_ph: ez | The HUD disappears. Only MATCH CHAT remains over black, with the 00:03 timer. The same two buttons, same crop, same scale as Scene 2: okay that was clean / fuck off. Nothing marks either one. Preserve the final-match message history: after victory, keep for you apparently 💀 above the reply controls. Never erase it on scene entry. Camera: Same chat crop as Scene 2 frame 2.07 and the second match | 3 s window; One tap, or let the clock expire | Reuse opening MATCH CHAT, exact button geometry/text and clock. |
| E.2A · ENDING A: give her credit | Chat: you: okay that was clean<br>lia_ph: gg | Your line, then after 0.8 s her reply: gg. Nothing else. No friendship reward, no thank you. Camera: Same chat crop | Hold 2 s; Cinematic | Same chat; player acknowledgment and proposed gg response. |
| E.2B · ENDING B: lash out | Chat: you: fuck off<br>(lia_ph closed the chat) | Your line lands on her screen. After 1 s the chat closes from her side. No breakdown, no punishment. Camera: Same chat crop | Hold 2 s; Cinematic | Same chat; player hostile line and proposed closed-chat state. |
| E.2C · ENDING C: nothing sent | Chat: 00:03 · 00:02 · 00:01<br>(reply box gone)<br>lia_ph requested a rematch | The clock runs out. The reply box disappears. The rematch invitation stays on screen, unanswered. Give it an unhurried beat. Camera: Same chat crop | Hold 3 s; Cinematic | Same chat; countdown expires, input vanishes, rematch remains. |
| E.3 · 4:25 AM, Good morning | Overlay: 4:25 AM — LAPU-LAPU CITY | Cut back to the room in the exact wide composition of the first visit. The fan still rattles. The rice container is still on the desk. Lia stretches, looks at the time, sighs. Camera: Wide, identical to the first visit | 3 s; Cinematic | Clone first-arrival room wide; clock 4:25 AM; existing food/fan. |
| E.4 · BREAK ENDS IN 00:15 | Screen: BREAK ENDS IN 00:15 | A work notification. She puts the headset back on. Camera: Medium | 1 s; Cinematic | Same monitor work label; headset-on pose. |
| E.5 · It was sent | Screen: Mama ❤️<br>[photo] Sent ✓✓ | She opens her mother's chat and checks whether her message went through. The two ticks are there. She closes the phone. Camera: Phone crop | 1.5 s; Cinematic | Same Mama thread; photo and Sent ticks visible. |
| E.6 · Okay. Kaya pa. | Lia: Okay. Kaya pa. | She adjusts the headset and says it to no one. Gloss: Okay. I can do this. Then she clicks AVAILABLE. Camera: Medium | Line hold; Cinematic | Medium headset adjustment; short spoken balloon. |
| E.7 · Thank you for calling | Lia: Thank you for calling. My name is Lia. How may I help you? | The camera stays on the room as she takes the next call. Her voice is professional again. Fade to black before we hear the customer. Camera: Wide; fade out on the line | Line, then 1 s fade; Cinematic | Return room wide; professional line, fade before caller speaks. |
| E.8 · Your side | — | Return to the player's original setup: the monitor is cracked, the game is still visible behind the crack, a small chat window sits in the corner. For a moment nothing moves. Cut to black. Camera: Static on the player's desk | 3 s, then cut; Cinematic | Reuse player desk/monitor from vacuum transition; crack overlay and tiny chat. |
| E.9 · END OF MATCH | Overlay: GG EZ<br>A game by Carl Kho & Dain Kim<br>END OF MATCH | Title card over black. No empathy score, no moral lesson, no screen that labels the player. Camera: Black | Hold until the player leaves; End | Black rectangle; title, names, END OF MATCH; restart control. |

**Exit:** END OF MATCH after all six routes; room, obligations and Lia continue; no moral grade.

**Sound:** Low electronic hum; timer ticks; Send blip, reply ping; Send blip; a soft close; Three ticks, then nothing; Fan; Work-app beep; Tap; Her voice; click; Her voice, then silence; Room tone, then nothing; Silence, then the title hum. Reuse existing cues; missing cues may stay silent for graybox.


## Branches and handoffs

| Scene | Input | Output / connection |
|---|---|---|
| p9 | After the mandatory customer-call scene; earlier observed objects | `motherMessageSent: true`; optional budget note in `seen`; go to k10. |
| k10 | Same room state | Friend exchange complete; go to t11. The player observes Lia's messages, not chooses them. |
| t11 | Ghost movement remains active | 4:17 break and voluntary monitor approach; go to f12. |
| f12 | Player combat input | `outcome: win/lose` from combat only; retain exact Lia chat messages; go to e13. |
| e13 | Outcome, chat history, previous reply choices/times, mother-message state | Final reply/timeout and response time; common epilogue; END OF MATCH; restart resets the run. |

F.6A and F.6B are alternatives. E.2A, E.2B and E.2C are alternatives. Two fight outcomes × three final replies make **six routes**, sharing one epilogue. Do not play the alternative cards in succession. On victory, carry `lia_ph: ez` AND `lia_ph: for you apparently 💀` into the final chat. On defeat, carry `lia_ph: ez`.

**Drafts to review:** E.2A's `gg` and E.2B's chat closure came from the short adaptation; v0.3 did not lock those responses. They remain proposals. K.5 and the other Cebuano adaptations need Carl's voice pass. P.6 uses `Sent ✓` instead of displaying the unresolved timestamp `2:3x AM`.

## Ready to replace the current game only when

A separate HTML candidate loads from its actual hosted subdirectory, runs title → fights → first visit → call → phone/friend/night → fair fight → final reply → epilogue → END OF MATCH, and restarts cleanly. Test real input and real three-second silence, not autoplay alone. Test all six ending combinations and both two-object/three-object exploration routes. Dain's supplied art must load, dialogue must fit, and no early scene may strand the player. A browser smoke test is not this gate.

## Source of truth

- Live Figma, inspected for this handoff: https://www.figma.com/design/9n83sdzD1t2Fm3asaMi1Hs/GG-EZ . Existing first-eight boards and Dain's assets stay intact. New tables are additive; new scene grayboxes await table review.
- Original five-scene proposal: `docs/storyboards/ACT45-TABLES.md` and `act45-story.json` on main `d7d061a`.
- Full v0.3 script and prior storyboard conversation were read before this handoff. This document incorporates the approved Lapu-Lapu/Cebuano direction, repeated reply pair, flat side-view vacuum, exact knockout replay and intangible ghost rules.
- Existing HTML scaffold: branch `dev/web`, commit `c5970c2`; it currently supplies sample/m2 previews, not the full campaign.

## Short page copy for the current game

**GG EZ:** A fighting game about losing to a stranger, then inconveniently discovering she's a person.

**How to play:** A/D or arrows to move, W to jump, J/K to attack, Space to continue. Click to explore and make questionable conversation choices.
