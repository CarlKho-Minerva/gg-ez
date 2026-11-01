# Audio credits

Original thirteen effects (swing, whiff, hit, blast, ko, chat, type, queue, smash, phone, room, crt, street): generated with ElevenLabs Sound Effects for GG EZ on 2026-10-28; reused from the existing game.

Additional recordings generated for this HTML campaign on 2026-11-01:
- 22 Lia lines: ElevenLabs stock voice Laura (FGY2WhTYpPnrIDTdsKH5), eleven_v3.
- 4 caller lines: ElevenLabs stock voice Roger (CwhRBWXzGAHq8TQ4Fs17), eleven_v3.
- 20-second arcade loop: ElevenLabs Sound Effects, eleven_text_to_sound_v2, loop enabled.

These are synthetic performances of fictional characters. No real person's voice was cloned. The exact spoken text and beat mapping are recorded in voice-script.json and voices.json. Pronunciation and performance should receive the team's playtest review. API credentials are not included.

## 2026-11-01 02:18 PST: Lia's Cebuano lines regenerated

Supersedes 15 of the 22 Lia lines above. Voice unchanged: ElevenLabs stock voice Laura (FGY2WhTYpPnrIDTdsKH5), model eleven_v3, now with the language enforced as Cebuano (`language_code: "ceb"`), output format mp3_44100_64, voice settings stability 0.4 / similarity_boost 0.8 / style 0.3. One audio tag, `[laughs]`, precedes "HAHAHA. Grabe." (voice-r-2-lia). Characters used: 327 (account went from 9268 to 9595 of the 10000-character free-tier month).

Regenerated (15): voice-r-5-lia, voice-r-2-lia, voice-p-5-lia, voice-k-5-lia, voice-n-5-lia, voice-e-6-lia, voice-c1-11-lia, voice-c1-10-lia, voice-c4-lia, voice-n2-lia, voice-c1-12-lia (the eleven lines containing Cebuano), and voice-r-3-lia, voice-r-4-lia, voice-c2-lia, voice-c3-lia (Lia's personal-scene English lines, so each room scene stays in one accent).

Untouched (still Laura, eleven_v3, no language enforcement): voice-v2-6-lia, voice-c1-3-lia, voice-c1-4-lia, voice-c1-6-lia, voice-c1-7-lia, voice-c1-9-lia, voice-e-7-lia (her customer-facing call-center lines), and the four Roger caller lines.

Why not a Voice Library voice: the free tier cannot use any Voice Library voice through the API. Jesi (ZnJRwODXspYo4KLSFKFc, accent cebuano) could not be added ("This voice is not available for free users") and refused text-to-speech ("You need to be on the creator tier or above to use this voice"); Cielle (6LXO12QQcaZd6xGp9UIZ, young Filipina, free-listed) was added to the account as "Lia GG EZ" but text-to-speech returned "Free users cannot use library voices via the API". No real person's voice was cloned. Still a synthetic performance of a fictional character; pronunciation should receive the team's playtest review.

## 2026-11-01 09:50 PST: all 22 Lia lines replaced with a Filipino neural voice

Supersedes every Lia entry above. The ElevenLabs "Laura" takes (a stock American voice, even with the Cebuano language code) were rejected as non-native, and the free tier refuses Voice Library voices through the API, so ElevenLabs is no longer used for Lia.

- Voice: `fil-PH-BlessicaNeural` (Filipino, female), one voice for all 22 lines, Cebuano and English alike, so Lia stays one speaker.
- Engine: Microsoft Edge neural text-to-speech, generated locally through the Python package `edge-tts` 7.3.1 (free, no API key, no account). Rate +0%, default pitch. Output as delivered by the service: MPEG-2 Layer III, 24 kHz, 48 kbps.
- Text: exactly the `text` field of each `speaker: "lia"` entry in voice-script.json, with ElevenLabs audio tags removed (the `[laughs]` before voice-r-2-lia is gone) and "HAHAHA. Grabe." spoken as "Hahaha. Grabe." so the laugh is read rather than spelled. Keys and file names unchanged.
- Replaced (22): voice-r-2-lia, voice-r-3-lia, voice-r-4-lia, voice-r-5-lia, voice-c2-lia, voice-c3-lia, voice-c4-lia, voice-n2-lia, voice-v2-6-lia, voice-c1-3-lia, voice-c1-4-lia, voice-c1-6-lia, voice-c1-7-lia, voice-c1-9-lia, voice-c1-10-lia, voice-c1-11-lia, voice-c1-12-lia, voice-p-5-lia, voice-k-5-lia, voice-n-5-lia, voice-e-6-lia, voice-e-7-lia.
- Unchanged (4): voice-c1-2-caller, voice-c1-4-caller, voice-c1-5-caller, voice-c1-7-caller (still ElevenLabs stock voice Roger, eleven_v3).
- Check before replacement: each file larger than 3 KB, starting with an MPEG frame header, and every frame decoded to the end (78 to 394 frames, 1.9 s to 9.5 s).

No real person's voice was cloned. Still a synthetic performance of a fictional character; pronunciation should receive the team's playtest review.
