# GG EZ Web Development Preview

**This is a development preview, not the full submitted game.** It ports the story-scene scaffold and two registered scenes to Vite, TypeScript and Phaser 3.90 at 1280 × 720. Arena action is scripted choreography, as in the supplied Godot story implementation; it is not a playable combat system. Audio is intentionally disabled in this preview. No deployment, submission, merge or push is part of this work.

## 1. Build and run

Run from this `web/` directory:

```sh
npm ci
npm run dev
npm run build
npm run zip
npm test
```

`build` first runs TypeScript with strict checks, then Vite. `zip` rebuilds and writes `gg-ez-web-ts.zip`, with `index.html` at the archive root. The archive is a static site, not source code. `dist/`, `node_modules/`, ZIP files and `preview/` results are ignored.

No query shows the registered-scene menu. The requested example is:

```text
http://127.0.0.1:5173/?scene=m2&autoplay=1&pick=fuck%20off&seen=phone
```

Interactive examples omit `autoplay=1`. Continue buttons (or Space/Enter) advance result cards. The reply window is three real seconds. Pick either exact reply, or let the timer expire. Autoplay accepts `pick=silence`; an unknown pick falls back to the first option. `seen` is comma-separated, with badge → phone → food priority and badge fallback.

## 2. Add or inspect a scene

`src/main.ts` uses eager `import.meta.glob('./scenes/*/index.ts')`. Each module exports `id`, `title`, and a default `StoryScene` subclass whose Phaser scene key equals `id`. No central registry edits are needed to add a scene. Unknown scene queries return to the menu with an error label.

`StoryScene` provides `arena`, `pixelSprite`, `rect`, `label`, `balloon`, `chatPanel`, `hold`, `tween`, `mark`, `waitAdvance`, `choose`, and `finish`. Phaser `init(ctx)` and `create()` host the asynchronous `run()` lifecycle. Shutdown aborts pending timers/tweens/input waits and removes HTML controls. A scene returns data through `finish`, never changes scenes itself.

Every `mark` waits two animation frames, sets `window.__beat`, appends a timestamp/text snapshot to `window.__beats`, and optionally awaits `window.__captureBeat(id)` for screenshot capture. `finish` sets `window.__done`. Asset/run failures set `window.__error` and show a visible failure panel rather than claiming completion. `__previewGame` exists only as instrumentation in this explicitly development-only build.

`src/scenes/m2/story.json` is the exact `m2` array from the supplied Act 3 storyboard. Runtime dialogue comes from that manifest. The Godot `m2.gd` supplies the motion, timing and positions. All eight files in the source `assets/dain/` are copied unchanged into `public/assets/dain/`; reference images are included but not loaded by the scenes.

## 3. Verification and resources

`npm test` serves built files exclusively below a fake `/sub/` prefix and launches Dia headlessly in an isolated Playwright context. It never uses a personal browser profile or logged-in tabs. The browser executable can be overridden with `PREVIEW_BROWSER` on another machine.

The suite covers the no-query menu, directory and index URLs, unknown scene, sample autoplay and real clicks, every m2 reply branch in autoplay and interactive mode, real timeout duration, inner-line selection/fallback/priority, small-screen button scaling, scene-shutdown cancellation, and a deliberately missing asset. It asserts every m2 beat in order and exact reply text, captures each marked card, and writes `preview/results.json`. Deliberately failed asset requests are a separate negative test, not successful-run errors.

The fixed-size canvas and accessible HTML controls share one CSS scale transform. `pixelArt` uses nearest-neighbour sprite scaling. Vite `base: './'` makes both generated files and image URLs relative to the hosting directory, including itch-style subpaths.

The closing fold uses two 640 × 720 canvas textures anchored at the middle; together their raw pixel storage is 3,686,400 bytes (3.52 MiB). They are destroyed after folding, including on cancellation. This is a fixed-resolution cost, not storage that grows per beat. Text snapshots grow with the finite number of storyboard cards and reset on scene start. Scene imports are eager by contract; Phaser dominates the JavaScript bundle. No private captures or generated screenshots are shipped in the ZIP.

See `VERIFICATION.md` for the measured result of the final local run. Screenshot files and raw timings remain under the ignored `preview/` directory.
