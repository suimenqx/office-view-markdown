# 01: Toolbar button retention (≤14, single theme, no upload on primary)

**What to build:** ADR 0016 residual (1). Primary toolbar on `office-view-markdown.markdownViewer` keeps a **short** set: outline; inline; block; undo/redo/find; right-anchored save / edit-in-vscode / **single theme entry** / settings. **Merge** current dual theme controls (`editor-theme` + `editor-theme-toggle`) into **one** primary entry. **Drop `upload` from the primary bar** — settings/more (or equivalent secondary surface) must still reach upload and any secondary theme controls. Cap **≤14 visible** primary controls; typical Studio width must not wrap into a shelf. Prefer edit `resource/markdown/util.js` `getToolbar` + theme toolbar modules; do not invent a second chrome family or Welcome.

**Blocked by:** None (forge starts here). 02/03 assume a short primary bar; sequence 01 → 02 → 03.

**Status:** ready-for-agent

**ui 观感：** 短主栏 ≤14；主题一入口；upload 离主栏。

- [ ] Primary visible control count ≤14 without wrap-shelf on typical Studio width
- [ ] Single theme entry on primary (no dual `editor-theme` + `editor-theme-toggle`)
- [ ] `upload` absent from primary bar; still reachable via settings/more
- [ ] Right-anchored save / edit-in-vscode / theme / settings retained
- [ ] No Welcome / second preview / new chrome family
- [ ] Light smoke on markdownViewer; build green; unit where toolbar composition is pure

## Comments

- Product lock 2026-09-21 (SGT): Studio scheme + ADR 0016 (`6af04ff`). Current `getToolbar` still lists `upload`, `editor-theme`, and `editor-theme-toggle` on the primary bar.
