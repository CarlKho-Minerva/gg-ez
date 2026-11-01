# GG EZ — HTML campaign

A fighting game about losing to a stranger, then inconveniently discovering she’s a person.

The default page is the complete 13-chapter Phaser campaign. Dain’s pixel artwork is reused throughout; the room uses the existing retrofit and character extraction. It includes keyboard/touch combat, three opening losses, a monitor transition, object exploration, the work call, Mama and Mika chats, a final fight, and three reply branches. Final victory depends on combat, independently of objects and conversation history.

## Run

Node 20.19+ or 22.12+. From `web/`: `npm ci`, then `npm run dev`.

- A/D or arrows: move; W/up: jump; J: strike; K: ranged crescent; L: guard.
- Space/Enter or Continue: advance a readable line.
- In the room, W/S or up/down also move the ghost vertically; click objects to observe them. Continue appears after any two observations; the third remains available.
- Reply windows last three seconds. Silence is timeout, not a third button.
- Progress saves at chapter boundaries when browser storage is available. Continue resumes the current chapter.
- Sound toggle mutes all sound. Dialogue is always subtitled. Voice playback may be interrupted by Continue.

## Build and package

`npm run build` checks TypeScript and produces `dist/` with relative asset paths. `npm run package` creates an itch-compatible ZIP (index.html at root) and a self-contained HTML file. No API keys, remote runtime calls, accounts, or server are needed in the shipped game.

## Verification

`npx playwright install chromium`, then `npm test`. You can set `PREVIEW_BROWSER` to an installed Chrome/Edge/Chromium executable instead. The campaign test serves only a nested `/game/` path, runs all six final outcome/reply combinations through every chapter, checks win-branch chat persistence, drives a real keyboard fight, and measures the actual silence timeout. Screenshots and the report go to `verification/`.

Development routes: `?scene=m2` retains the earlier isolated scene; `?scene=campaign&chapter=7` starts the call (chapters are zero-based). `autoplay=1`, `pick=...`, and `outcome=win` are test-only query options; normal play never uses them. `?resume=1` uses saved progress.

## Audio and source

Thirteen existing ElevenLabs effects, 26 ElevenLabs voice recordings, and a generated arcade loop are bundled locally. See `public/assets/audio/CREDITS.md` and `voice-script.json`. Cebuano lines retain English glosses; a human pronunciation pass is still useful. The narrative tables are in `docs/storyboards/FINAL-SCENES-HTML-HANDOFF.md` at repository root and the runtime scene manifests under `src/campaign/`.

This candidate is separate from the existing public itch upload. The old playable game is not replaced by these development commands.
