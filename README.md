# GG (working title)

A short browser game by Carl Kho and Dain Kim. You lose an online match to someone better, she types "ez", and you get to choose what you type back. Then you see the other side.

Made for the Checkpoint Game Jam 2026 ("Play to Prevent") and the ElevenLabs x PostHog x Nimble Fox jam. Godot 4.7, one script (`main.gd`).

Run: open the folder in Godot 4.7 and press Play, or `godot --path .`. Self-playing test run: `godot --path . -- --autoplay`.

Draft state (2026-10-28): playable end to end with placeholder text; the opponent sprite and controller are placeholders; PostHog key not set (`POSTHOG_KEY` in `main.gd`).

## AI use and credits
- Code drafted with Claude (Anthropic), edited by the team.
- Art generated locally with Krea 2 Turbo (`tools/checkpoint_assets.py`, raw outputs in `tools/raw/`), cut out with `tools/process_assets.py`. Screen crack drawn by script.
- Sound effects generated with ElevenLabs.
