# GG EZ delivery notebook

31 October 2026, Office Mac. Source baseline: 96537b5.

## 1. Reconcile the design with the source

- Checked main.gd, HANDOFF.md and local ACT3/ACT45 storyboard tables. A final git comparison confirms runtime and tables are unchanged from the source baseline.
- The repeatable rigged-match loop is existing gameplay. Thirteen scenes are a production plan, not a playable campaign.
- Removed the unsupported total-duration clock. The figure shows scene order and production evidence, with partial runtime counterparts explicitly distinguished from complete scenes.
- Corrected reply-time, ending and local-log descriptions. Three seconds is the reply constraint, not a guarantee that recorded elapsed time is exactly 3000 milliseconds. A console event is not proof of a successful local save.
- Preserved wording/locale differences between runtime and plan. No new playtest, prevention result or independent Cebuano/workplace review is claimed.

## 2. Inspect the delivered PDF

- Six A4 pages, 252337 bytes, generated with pandoc 3.11 and WeasyPrint 70.0.
- Opened first two page images, the figure and table pages. Checked all six page images across the render iterations, including the final figure/table spread on pages 3 and 4.
- Title and body are readable; figure labels fit; table headers repeat on page 4; rows are not broken across that page boundary. Some white space remains on pages 2 and 6. No clipping observed.
- Text-bound check: every extracted word lies within its page on all six pages. This does not certify accessibility or every possible viewer.
- pdfimages confirms the 2000 x 1430 figure is embedded on page 3 at approximately 299 pixels per inch.
- Representative images: page-1.png, page-2.png, page-3.png, page-4.png. Full set: page-1.png through page-6.png.

## 3. Review the six habits of mind

Automated route: vet-hc, verified Azure-credit gpt-5.5 lane, not Claude subscription. Final reviews use explicit staged diffs and read-only source context.

| Habit | Final automated outcome | Inline/manual review |
|---|---|---|
| composition | checked-composition: exit 0, no issues | Answer-first opening; concise sections; proposed actions separate from current behaviour; quotes distinguish game insults from document voice. |
| communicationdesign | resolved-communicationdesign: exit 0, no issues | Hierarchy and first-two-page layout inspected; repeated table headers; figure explains its symbols in words. |
| evidencebased | checked-evidencebased: exit 0, no issues | Runtime statements traced to source; draft constraints not measurements; no behaviour-change claim; historical autoplay not new verification. |
| dataviz | checked-dataviz: exit 0, no issues | Scene order is not elapsed time or completion percentage; state is communicated by both shapes and labels, not colour alone. |
| professionalism | checked-professionalism: exit 0, no issues | Credits and AI disclosure present; no assertion of team approval; quoted profanity belongs to game content; cultural/language review remains pending. |
| designthinking | checked-designthinking: exit 0, no issues | Clear reuse-versus-add plan and scoped next work; prototype iteration is described without claiming user validation; next human playtest questions are explicit. |

Review history is not six uninterrupted passes:
- Earlier-version reviews were superseded. The first six logs retained here (vet-*) all exited 10. They identified useful dependency/version, provenance wording and pandoc-warning problems, plus snapshot mistakes that falsely treated reference main.gd as a change and misplaced storyboard paths.
- Fixed owned-code findings: Pillow >= 10.1 documented and checked; fallback-font compatibility checked; source-review framing removed from the opening; PDF parseability comment narrowed; pandoc warnings now fail closed.
- A subsequent untracked-file review (final-*) returned no issues but is not counted as final evidence because the target files had not been explicitly staged.
- Explicit staged reviews (checked-*) returned five clean outcomes and communicationdesign exit 10 because the generated PDF was omitted from that small review snapshot. Added the actual PDF and figure to the snapshot and reran communicationdesign; resolved-* returned exit 0.
- Reference-game findings were not fixed in main.gd, which is outside ownership. The silent local-save limitation remains documented in the GDD.

## 4. Exercise failures and review resources

Seven final-script failure tests passed: missing pandoc, missing Python, missing pdfinfo, unavailable Pillow (Python with site packages disabled), renderer exit 23, renderer resource error despite exit 0, and pandoc resource warning despite exit 0. Every test exited nonzero and preserved the existing PDF hash. Individual stderr logs and failure-tests.txt record the evidence.

- Bash and Python syntax checks passed. git diff --check passed.
- Final normal render: 0.82 seconds wall time; maximum resident set approximately 133 MiB; zero swaps. This is one local warm render, not a benchmark distribution.
- Figure generation is proportional to scene count and image pixels; the fixed 2000 x 1430 RGB image needs about 8.2 MiB for its pixel buffer, plus Pillow/font/renderer overhead.
- Full pipeline scales with document content and image size; no corpus processing, network rendering or bulk model calls are part of rendering. HTML embeds the figure and stylesheet; output is replaced only after the renderer succeeds and pdfinfo can parse it.
- Review scratch repositories stay local and are not staged. Only selected review logs, images and this notebook accompany the six owned deliverables.

## 5. Deliver locally

Owned deliverables: docs/GDD.md, docs/GDD.pdf, docs/gdd.css, docs/fig-scene-clock.png, tools/fig_scene_clock.py, tools/render_gdd.sh.

No game changes, itch actions or push. The pre-existing modified gg-ez-web-3d.zip is left untouched. Commit author and committer: Carl Kho <kho@uni.minerva.edu>, without a coauthor trailer.
