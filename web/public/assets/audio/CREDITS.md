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

## 2026-11-01 14:00 PST: all 22 Lia lines regenerated with a Cebuano Voice Library voice

Supersedes every Lia entry above. The Microsoft `fil-PH-BlessicaNeural` takes (a Tagalog voice) and the earlier ElevenLabs Laura takes were both rejected as non-native; this pass uses a Cebuano-accented woman from the ElevenLabs Voice Library, generated on the ElevenLabs account that holds the credits.

- Voice: "Ate Marcela - Joyful and Optimistic", ElevenLabs Voice Library voice `NL3wAdhrhsFZAoDTBMHk`, added to the account under the name "Lia GG EZ (Cebuana)" (the voice keeps the same voice_id after adding). Library record: language fil, accent cebuano, locale ceb-PH, female, middle-aged, category high_quality, use case advertisement, about 3.5 million characters of library use in the past year. Its description calls it a Cebuano voice artist for Cebuano-language voiceovers. The library record carries only a publisher id, no handle: `public_owner_id 18b6f038186ba974fe33d7f281cb40fd9146c95a452425bd6a582689ad9c585e` (the same publisher as Jesi, Tiya Maria and Dodong Macoy). One voice for all 22 lines, Cebuano and English alike, so Lia stays one speaker.
- Why this voice: the library was searched on the grant account with six filters (language ceb; language fil + accent cebuano; the words cebuano, bisaya, visayan and cebuana), all restricted to female where the filter allows it. No young Cebuana exists in the library. The four female-tagged Cebuano-accent voices are Jesi (its description says Hiligaynon, the Ilonggo melody rather than Cebuano), Vyn Kuwentista (its description says male), Tiya Maria (a horror storyteller) and Ate Marcela (the only one whose description says Cebuano). Jess (young, Philippine English with a Cebuano cadence) is an English-only voice. Ate Marcela was chosen for the accent; her age tag (middle-aged) is the known compromise.
- Alternate: a complete second set of the same 22 lines was generated with Jesi (`ZnJRwODXspYo4KLSFKFc`, added as "Lia GG EZ alt (Jesi)") and kept outside the repository for an ear test, not shipped.
- Model: `eleven_v3`, output format mp3_44100_64 (MPEG Layer III, 44.1 kHz, 64 kbps), voice settings stability 0.45 / similarity_boost 0.8 / style 0.35. `language_code: "ceb"` on the eleven lines that contain Cebuano (voice-r-2-lia, voice-r-5-lia, voice-c4-lia, voice-n2-lia, voice-c1-10-lia, voice-c1-11-lia, voice-c1-12-lia, voice-p-5-lia, voice-k-5-lia, voice-n-5-lia, voice-e-6-lia); no language code on the eleven English lines. The API accepted every request on the first model, so no fallback model was used. Text is exactly the `text` field of each `speaker: "lia"` entry in voice-script.json, with one audio tag, `[laughs]`, placed before "HAHAHA. Grabe." (voice-r-2-lia). Keys and file names unchanged; voice-script.json and voices.json unchanged.
- Account: carl@somach.life, ElevenLabs tier "grant" (33,110,000-character allowance). Characters used: the account's character_count went from 0 to 1,461 (both the shipped Ate Marcela set and the Jesi alternate, 770 characters of text each, plus one retake).
- Check before replacement: each file larger than 4 KB, starting with an MPEG frame or ID3 header, and 1.60 to 8.48 s long by ffprobe. One retake: voice-n-5-lia ("Usa pa.") first came out at 0.64 s and was regenerated once (2.00 s) with the same settings.
- Replaced (22): voice-r-2-lia, voice-r-3-lia, voice-r-4-lia, voice-r-5-lia, voice-c2-lia, voice-c3-lia, voice-c4-lia, voice-n2-lia, voice-v2-6-lia, voice-c1-3-lia, voice-c1-4-lia, voice-c1-6-lia, voice-c1-7-lia, voice-c1-9-lia, voice-c1-10-lia, voice-c1-11-lia, voice-c1-12-lia, voice-p-5-lia, voice-k-5-lia, voice-n-5-lia, voice-e-6-lia, voice-e-7-lia.
- Unchanged: the four caller lines (voice-c1-2-caller, voice-c1-4-caller, voice-c1-5-caller, voice-c1-7-caller, still ElevenLabs stock voice Roger, eleven_v3), the thirteen effects and the arcade loop.

No real person's voice was cloned: Voice Library voices are the publisher's own published synthetic or licensed voices, used under the library's terms, and this account performed no voice cloning. Still a synthetic performance of a fictional character; pronunciation and performance should receive the team's playtest review.

## 2026-11-01 14:20 PST: transcription check and one retake

Round trip through ElevenLabs speech-to-text (scribe_v1, language ceb) on the eleven Cebuano lines (tools/stt_check.py): Ate Marcela's set reads back with a mean word match of 0.77 against the script after the retake below (0.73 before), the Jesi alternative 0.59. Lines that read back exactly: K.5, E.6, C1.11, C1.10, N2, C1.12. The two-syllable "Usa pa." (voice-n-5-lia) is heard as "Usapa" or "O sapa" in every take, so it stays as generated. voice-c1-10-lia ("Kana. Customer empathy.") was retaken once with stability 0.6 and now transcribes exactly (tools/voice_retake.py); the earlier take is kept beside it on the Mac. Nobody has listened with ears; this is a machine's reading.
