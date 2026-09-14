# SMOKE — in-session caret continuity (ADR 0010)

Acceptance surface: `office-view-markdown.markdownViewer` only. Open a Markdown
file containing prose, a task list, two fenced code blocks, and (if available)
one math/diagram block. Do not use the stock Markdown preview/editor.

1. Click once inside the first prose paragraph, then use ArrowDown/ArrowRight
   at the block edge to enter the following code block. Confirm the caret lands
   at the expected start and the viewport follows once.
2. In the code block, use ArrowUp/ArrowLeft at the first position and
   ArrowDown/ArrowRight at the final position. Repeat with Home and End on the
   first/last line. Confirm each crossing needs one keypress, preserves the
   expected side, and does not jump to block top before rehoming.
3. At the prose/code boundary, use Backspace and Enter. Confirm the selection
   side is deterministic and no extra empty action is needed. Hold Shift while
   crossing to confirm selection is not stolen by the boundary helper.
4. Click once on a rendered special block edge to enter edit. Confirm a
   double-click is not required. Leave and re-enter it; confirm its source
   caret is restored rather than collapsed to offset 0.
5. Open the code language/theme chrome and press Tab and Shift+Tab from its
   controls. Confirm focus leaves chrome to code content; it must not cycle
   forever among chrome controls.
6. Drag-select prose, then drag-select code. In Auto, Light, and Dark themes
   (High Contrast if available), confirm the selection family remains
   theme-affine rather than system-blue in prose and a different color in CM.
7. Place the caret in the middle of a code block, scroll it out of the lazy
   mount window, wait for teardown, then scroll it back. Confirm the same caret
   offset and selection direction return without a collapse to block top.
8. In the same session, switch WYSIWYG ↔ IR if enabled and trigger a prose
   re-render (for example, a harmless edit). Confirm the logical block and
   caret/selection survive the presentation transition.

FindBar is intentionally not changed in this wave; it remains a future
consumer of the document-position contract.
