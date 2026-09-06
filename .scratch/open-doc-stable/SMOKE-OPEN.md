# Smoke: open-document stability (打开即稳)

Acceptance is only on `office-view-markdown.markdownViewer` (stock Markdown does not count). Prefer a late-but-complete Reading Surface over half chrome; first frame must use Editor Font Size; restore scroll/caret once after ready without outline active-state flash.

## Force the custom editor

Stock `code file.md` often opens the default Markdown editor. Use one of:

### A. One-shot script (recommended)

Reuse the AES open harness pattern with a long fixture:

```bash
FIXTURE=test/markdown/LongOpen.md ./test/smoke/open-aes-fixture.sh
FIXTURE=test/markdown/LongOpen.md ./test/smoke/open-aes-fixture.sh dist/*.vsix
```

Or open `test/markdown/UxPolish.md` the same way for theme/font first-paint checks.

### B. Sticky association

```json
"workbench.editorAssociations": {
  "*.md": "office-view-markdown.markdownViewer",
  "*.markdown": "office-view-markdown.markdownViewer"
}
```

### C. Reopen With…

Command Palette → `View: Reopen Editor With…` → **Office View Markdown**, or `office-view-markdown.switch`.

`viewType`: `office-view-markdown.markdownViewer`

## Checks

1. **首屏不闪 / 字号一次到位** — Cold-open `UxPolish.md` or `LongOpen.md` in Light and Dark(/HC). First visible frame is the Reading Surface with configured `office-view-markdown.editorFontSize` (or follow `editor.fontSize` when 0). No empty `#vditor` stock chrome, no default→override font jump, no Welcome/skeleton/second preview.
2. **滚位/光标可恢复** — Scroll mid-doc, place caret (prose or inside a code block), close tab, reopen. With `office-view-markdown.restoreViewState` **on** (package default): scroll + caret restore once after ready. With setting **off**: scroll still restores; caret/focus is not forced.
3. **Long doc settle** — On `test/markdown/LongOpen.md`, reopen at a deep scroll position near code blocks. Viewport should land near the saved scroll without an obvious top→target dance or late undo after lazy CodeMirror mounts.
4. **pendingFragment** — Outline/wiki fragment open still overrides session scroll for that open.

## Fixture path

- Long: `test/markdown/LongOpen.md`
- General chrome: `test/markdown/UxPolish.md`
