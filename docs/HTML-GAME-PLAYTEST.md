# GG EZ — playtest handoff

The HTML campaign is implemented end to end on `dev/full-html-campaign`. Run `npm ci` then `npm run dev` inside `web/`, or open the packaged GG-EZ-PLAY.html directly. Upload GG-EZ-itch.zip as an HTML game when the team is ready to replace the current itch build.

| Person | Work | Where |
|---|---|---|
| Carl | Play through; judge dialogue, Cebuano, pacing, final fight feel | Whole campaign; report the visible line or chapter |
| Dain | Replace or refine room/character poses; keep current sprite dimensions and filenames to avoid integration work | web/public/assets/dain/ |
| Implementation | Story and timing adjustments, state transitions, fight tuning, rebuild and package | web/src/campaign/Campaign.ts; runtime tables beside it |

The final five scene tables remain the narrative reference. Browser implementation uses Dain's existing artwork and local ElevenLabs audio. There is no Godot dependency in the HTML package.

Description: A fighting game about losing to a stranger, then inconveniently discovering she’s a person.

How to play: Move with WASD/arrows, fight with J/K/L, and click to explore, advance, or make the chat worse.

Detailed controls: A/D or left/right to move; W/up to jump; J strikes; K casts; L blocks. Space/Enter advances dialogue. In the room W/S or up/down also floats vertically. Observe any two objects to unlock Continue; the third stays available. Replies have a three-second deadline; waiting sends nothing.
