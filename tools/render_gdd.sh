#!/bin/bash
# Source -> figure -> embedded HTML -> parseable PDF. Preserve the last PDF on failure.
# Dependencies: pandoc, weasyprint, poppler (pdfinfo), and Python with Pillow >= 10.1.
# Office Mac reuses pptx-qa; elsewhere set PYTHON to your Pillow-enabled interpreter.
# To prepare that interpreter: "$PYTHON" -m pip install 'Pillow>=10.1'
set -euo pipefail
cd "$(dirname "$0")/.."
PANDOC="${PANDOC:-/opt/homebrew/bin/pandoc}"
WEASY="${WEASY:-/opt/homebrew/bin/weasyprint}"
PDFINFO="${PDFINFO:-/opt/homebrew/bin/pdfinfo}"
PYTHON="${PYTHON:-$HOME/.local/venvs/pptx-qa/bin/python}"
for t in "$PANDOC" "$WEASY" "$PDFINFO" "$PYTHON"; do
  [ -x "$t" ] || { echo "missing executable: $t" >&2; exit 1; }
done
for f in docs/GDD.md docs/gdd.css tools/fig_scene_clock.py; do
  [ -s "$f" ] || { echo "missing or empty source: $f" >&2; exit 1; }
done
mkdir -p build/gdd-review
"$PYTHON" tools/fig_scene_clock.py
[ -s docs/fig-scene-clock.png ] || { echo "figure is empty" >&2; exit 1; }
"$PANDOC" docs/GDD.md --from markdown --standalone --embed-resources \
  --resource-path=docs --css=docs/gdd.css \
  --metadata pagetitle="GG EZ Game Design Document" \
  --metadata author="Carl Kho and Dain Kim" \
  -o build/gdd-review/gdd.html 2> build/gdd-review/pandoc.err
if grep -Ei 'WARNING|ERROR|Could not fetch|Failed to load' build/gdd-review/pandoc.err >&2; then
  echo "pandoc reported a warning or failed resource; previous PDF preserved" >&2
  exit 1
fi
"$WEASY" build/gdd-review/gdd.html build/gdd-review/GDD.pending.pdf \
  2> build/gdd-review/render.err
# WeasyPrint can exit 0 after dropping an image or stylesheet; reject those errors.
if grep -E 'ERROR|Failed to load' build/gdd-review/render.err >&2; then
  echo "render reported a failed resource; previous PDF preserved" >&2
  exit 1
fi
[ -s build/gdd-review/GDD.pending.pdf ] || { echo "rendered PDF empty" >&2; exit 1; }
"$PDFINFO" build/gdd-review/GDD.pending.pdf > build/gdd-review/pdfinfo.txt
mv build/gdd-review/GDD.pending.pdf docs/GDD.pdf
printf 'wrote %s/docs/GDD.pdf (%s bytes)\n' "$PWD" "$(wc -c < docs/GDD.pdf | tr -d ' ')"
