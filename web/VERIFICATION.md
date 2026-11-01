# Development Preview Verification

This is a web-native story development preview, not the full submitted GG EZ game. Combat remains scripted; audio is disabled. No push, merge, deployment or submission was performed.

## 1. Repair and verify the actual result

Final local run: 2026-10-31, San Francisco time. `npm run zip && npm test` exited 0. The build runs strict TypeScript checking before Vite. The final suite ran in 123 seconds in an isolated headless Dia context, without a personal profile or logged-in browser session.

Passed checks:

- No-query menu lists `_sample` and `m2`; both launch. Unknown scene returns to the menu.
- `_sample` runs in autoplay and through actual reply/Continue button clicks.
- All m2 reply branches run in autoplay and interactive mode: `okay that was clean`, `fuck off`, and real clock-expired silence. Every marked card appears in the asserted order.
- Actual interactive result cards wait for Continue, rather than auto-advancing. Reply buttons disappear after a pick; timeout closes and disables the reply box. The observed real timeout-to-branch interval was 3,165.1 ms, including browser scheduling and the two rendered frames before marking the branch.
- Badge, phone and food each select their exact inner thought. Unknown observations fall back to badge; combined observations preserve badge → phone → food priority. Unknown autoplay pick falls back to the first reply.
- Built files work at fake `/sub/index.html` AND the directory URL `/sub/`. The test server deliberately refuses root-level asset paths. No unexpected missing asset requests or successful-scene browser errors occurred.
- 640 × 360 viewport controls remain clickable under the shared canvas/UI scale.
- Stopping m2 during an input wait removes its controls, does not emit a stale `__done`, and allows a new sample scene to finish.
- A deliberately missing arena asset displays a visible error and never sets `__done`.
- The m2 JSON manifest exactly equals the source storyboard's `m2` array. All eight copied Dain files match the source files by SHA-256.

Screenshot inspection covered the menu, all eight cards on a complete m2 path, both alternative reply cards, all three inner thoughts, the sample arena/balloon/choice, and the final thin light line. The original reversed/off-center fold was repaired; the final fold uses correctly ordered half-frames anchored at the middle. Final full-size fold and interactive branch screenshots were inspected again after the final build.

Raw results and per-beat screenshots are in the ignored `preview/` directory. Eight full m2 runs and one sample autoplay run are recorded, plus a timeout timing row. Additional menu/sample interaction, small-screen, shutdown and missing-asset tests are asserted directly in the harness.

## 2. Failure paths and review

Shutdown aborts timer/tween/input waits. Reply clicks are accepted only while their deadline is live. The screenshot handshake completes before starting the three-second reply window, so capture I/O cannot consume the player's time. Missing assets and run errors are visible failures, not successful completion.

Azure `vet-hc` ran twice through the pfc GPT-5.5 credit lane, not Claude. Its initial review raised a directory-route issue; the code already mapped an empty suffix to `index.html`, and the final harness explicitly proved `/sub/`. The final Azure review exited 0 and reported **No issues found**. Review outputs remain in `preview/vet-initial.txt` and `preview/vet-final.txt`.

## 3. Runtime and space

Measured on the local fake-subpath server, across eight m2 runs:

| Measurement | Final result |
| --- | ---: |
| Navigation to first m2 beat, median | 596.65 ms |
| Navigation to first m2 beat, range | 561.10–839.90 ms |
| App-entry to first m2 beat, median | 542.95 ms |
| Minified JavaScript file | 1,226,462 bytes |
| Entire uncompressed static site | 1,919,822 bytes |
| Root-index ZIP | 1,029,648 bytes |

In words: the first m2 card appeared in about six-tenths of a second locally, and the complete downloadable site is about one megabyte zipped. These timings are not remote itch network measurements. Phaser dominates the JavaScript; reference art is shipped but not loaded by scenes. Eager scene imports are deliberate, as requested.

The two half-frame buffers together hold 3,686,400 raw pixel bytes (3.52 MiB), at fixed resolution. They are released after folding or cancellation. Input listeners and pending timers are cleaned up. Beat/text records are finite per scene and reset on start. Full browser heap usage was not profiled; this is an explicit gap, not a claimed memory measurement.

ZIP SHA-256:

```text
d5d4d052ba13bf0ab461394e762bea19d2b96e215cb84925a74982b0dad77dac
```

The archive passed integrity checking, contains `index.html` at root, contains no wrapping `dist/` directory, and every archived file byte-matches the final `dist/` output. Old hashed build files are removed on repeat ZIP builds by the archive sync option.
