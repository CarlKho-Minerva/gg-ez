# GG EZ — playtest handoff

The HTML campaign is implemented end to end on `dev/full-html-campaign`. Run `npm ci` then `npm run dev` inside `web/`, or open the packaged GG-EZ-PLAY.html directly. Upload GG-EZ-itch.zip as an HTML game when the team is ready to replace the current itch build.

| Person | Work | Where |
|---|---|---|
| Carl | Play through; judge dialogue, Cebuano, pacing, final fight feel | Whole campaign; report the visible line or chapter |
| Dain | Replace or refine room/character poses; keep current sprite dimensions and filenames to avoid integration work | web/public/assets/dain/ |
| Implementation | Story and timing adjustments, state transitions, fight tuning, rebuild and package | web/src/campaign/Campaign.ts; runtime tables beside it |

The final five scene tables remain the narrative reference. Browser implementation uses Dain's existing artwork and local ElevenLabs audio. There is no Godot dependency in the HTML package.

Description (public, spoiler-free): One more game. You lose by a hair, she types ez, and you get three seconds and two replies. The rest of the game is the twist and stays off the page.

How to play: A/D move, W jump, S dash, J strike (J J J string), K crescent (J J K finisher), L block (timed L parries). Space advances. Drift into objects to observe.

Detailed controls: A/D or left/right to move; W/up to jump; S/down dashes through her; J strikes and chains three; K casts, and after two strikes finishes; L blocks, and a block on the hit parries. Lia closes, retreats, blinks behind you, swings up close, casts and fires barrages; the first three matches are rigged, the final one is fair (150 health, no floor, no drain). Space/Enter advances dialogue. In the room W/S or up/down also floats vertically. Observe any two objects to unlock Continue; the third stays available. Replies have a three-second deadline; waiting sends nothing.
