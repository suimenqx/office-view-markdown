# SMOKE — document-semantic Find/Replace (ADR 0011)

Acceptance surface: `office-view-markdown.markdownViewer` only. Open
`test/markdown/SemanticFind.md` (or any doc with prose + emphasis/link + a
fenced code block). Reuse the existing FindBar chrome — do not open a second
preview or Find UI.

## Sequence

0. **Find typing isolation (Light)** — Focus the existing FindBar query field and
   type a query rapidly, including a query whose current match is in a fenced
   code block. Focus stays in FindBar, the caret/selection stays in the query
   field, CodeMirror does not steal focus, and no typed character is added to
   the authored Markdown body. Repeat with the Replace field. Capture the
   FindBar and unchanged body in one `markdownViewer` screenshot/checklist.
1. **Honest count** — Ctrl/Cmd+F for `token`. Expect one document-wide `n/N`
   that includes prose, cross-emphasis/link text, and the fenced code source.
   Count must not be “DOM hits + CM hits”.
2. **Cross-inline hit** — Find a string that spans an emphasis or link
   boundary in the fixture. Expect one hit (not dropped).
3. **Mount without count change** — Note `n/N`, Find Next into the code block
   so CM mounts to reveal the hit. Count and order must stay the same.
4. **Find Next lands once** — On each Next/Prev, viewport + selection land on
   the source range once (ADR 0010). No flash to block top then rehome.
5. **Highlight family** — Current vs other = two levels only; prose CSS
   Highlight and CM decorations share the same findMatch* token family
   (Light/Dark(/HC) readable). No DOM yellow vs unrelated CM color.
6. **Replace Current** — Replace one hit. Expect count to drop by one; one
   undo unit via ADR 0009 (`findReplace`); caret/selection restores via
   document position.
7. **Replace All** — Replace remaining hits in one command. Expect `0`
   remaining for that query; one undo unit for the whole command; Ctrl+Z
   restores the prior document once.
8. **Chrome exclusion** — Hidden / aria-hidden / FindBar / CM chrome never
   produce phantom hits.

## UI 观感 (Studio locked)

- 高亮同族 · 计数诚实 · 跳转一次落稳

## Residual risks

- Browsers without CSS Custom Highlight fall back to CM decorations only for
  mounted code; prose may lack paint until Highlight API is available.
- IR mode parity is best-effort; acceptance is `markdownViewer` WYSIWYG first.
- Very large docs: full re-index on each MutationObserver refresh; acceptable
  for this slice, not a perf redesign.
- Regex whole-word edge cases follow existing `\b` semantics.
