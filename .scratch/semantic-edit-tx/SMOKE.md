# SMOKE — semantic editing transactions (ADR 0009)

Host: `office-view-markdown.markdownViewer` only (not stock preview).

## Sequence

1. Open a Markdown doc with prose, a fenced code block, a task list item, and a link (or HTML inline).
2. **Prose** — edit a paragraph. Expect one dirty pulse (tab dot once).
3. **afterRender prose burst** — type a short prose burst that still goes through the debounced `afterRenderEvent` path. Expect one ADR 0009 intent: one undo unit and one dirty/input pulse after the idle delay, with no mid-burst split.
4. **afterRender undo** — Press Ctrl+Z once. The complete prose burst is undone once; there is no second undo step from the delay plus blur/click flush.
5. **Code** — focus the CodeMirror block, type a change, blur. Expect one additional undo unit / one dirty (not delay+blur double).
6. **Task** — toggle the checkbox. Expect one undo unit / same dirty channel (no extra flash).
7. **Link/HTML** — edit via popover and save (or unlink). Expect one undo unit.
8. **Undo** — Ctrl+Z through the sequence (focus may be in prose or still in a code block). Each step restores prior Markdown; caret/selection settles once (no jump-to-block-top then rehome). Focus must **not** hand Ctrl+Z to a private CM stack.
9. **Redo** — Ctrl+Y / Shift+Ctrl+Z as applicable; intents return in order.
10. **Save** — on-disk Markdown matches the visible document; dirty clears once.
11. **Presentation-only** — scroll to remount/lazy-teardown a code block, or refresh a diagram preview, without editing. Dirty must **not** pulse; undo stack must not grow.

## UI 观感

- Shared focus token when entering/leaving code · task · link — no second focus ring flash.
- No per-block undo chrome; no visual cue that focus owns history.

## Residual

- Full FindBar / async render-generation consumers are out of this wave.
- In-session caret continuity across DOM↔CM boundaries (pain #2) is related-later; this smoke only requires stable position after commit/undo.
