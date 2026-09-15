# SMOKE — unintended write-back fidelity (ADR 0015)

Acceptance surface: `office-view-markdown.markdownViewer` only. Open
`test/markdown/UnintendedWriteFidelity.md`; do not use the stock Markdown
preview/editor.

## Light sequence

1. Open the fixture and do nothing. The custom-editor tab stays clean; neither
   compact table is padded, and the working-tree diff is empty.
2. Wait through the initial render, passive scroll/lazy work, and a theme
   refresh. The tab must not flash dirty and the file must remain byte-identical.
3. Edit `one` to `changed` in the first table, then wait for the debounced save.
   The first table may contain the intentional cell edit, but the prose and
   second table must remain byte-identical to the opened fixture.
4. Save, then inspect `git diff -- test/markdown/UnintendedWriteFidelity.md`.
   The diff contains the authored cell change, not a document-wide table
   reformat. Undo/redo remains one existing ADR 0009 document transaction.

## Automated evidence

- `node test/unit/writeBackFidelity.test.js` covers the `\r`-safe fingerprint,
  no-intent gate, Lute compact-table normalization, and source restoration.
- `node test/unit/spanPreservingSync.test.js` covers one-cell edit plus an
  untouched table/prose span retaining authored bytes.
- `npm run build` and the complete `node test/unit/*.test.js` suite pass.

## Residual risks

- Full VS Code Light screenshots and git-diff capture are manual host checks;
  this change was verified at the Vditor/host seams, not by a GUI harness.
- A table whose actual cell content changes is serialized by Lute for that
  changed span; the fidelity contract preserves all matching untouched spans.
- Intentional whitespace-only reformatting is deliberately conservative when
  it is semantically indistinguishable from Lute presentation churn.
