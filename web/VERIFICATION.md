# HTML campaign verification — 2026-11-01

- TypeScript and Vite production build: pass.
- Six complete campaign paths (win/loss × credit/hostile/silence): pass, 107 recorded beats each, all 13 chapters.
- Win-branch sarcasm persists into the final choice: pass.
- Real keyboard final fight: victory with 9 landed hits and 2 successful blocks.
- Real silence timer: 3,014 ms in the final run.
- Standalone HTML opened from a file URL at 960×540: normal-controls full playthrough completed in 196.985 seconds, all three room objects inspected, credits reached, no JavaScript errors. This driver advances text promptly; a reading playthrough takes longer.
- Browser decoding: all 40 bundled MP3s pass (114.08 seconds of unique audio).
- Nested /game/ serving: no missing assets; no runtime remote dependency.
- ZIP: all 56 entries pass CRC verification, index.html is at root, 40 MP3s included.

Tests write screenshots and machine-readable results to the ignored verification/ folder. `npm test` runs the six routes, real combat, and timer checks; `node tools/playthrough.mjs` checks the packaged standalone HTML. Set PREVIEW_BROWSER or install Playwright Chromium first.

Human playtest focus: Cebuano pronunciation and glosses, dialogue pacing, final fight balance, and room pose clarity using the existing art. The thirteen-chapter structure and all ending paths are implemented; this is a playable candidate, not a claim that human playtesting is finished. The current itch upload has not been modified.
