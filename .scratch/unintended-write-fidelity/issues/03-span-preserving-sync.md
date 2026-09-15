# 03: Dirty-region / span-preserving sync

**What to build:** ADR 0015 residual (3). When the user edits one table cell (or one intentional span), write-back must not rewrite **every** table / untouched block in the file. Preserve original source bytes for spans outside the dirty region so git/diff shows only what the user changed. Build on 01 (intent gate) + 02 (table serialize fidelity): either dirty-region merge, span-preserving sync, or equivalent — do **not** invent a second document model or preview surface. Acceptance: edit one cell in a multi-table fixture → only intentional change appears in diff; other tables byte-identical to open.

**Blocked by:** Forge sequence after 01 → 02; uses no-intent gate + table preserve evidence. Prefer extend existing afterRender / updateTextDocument / ADR 0009 commit paths.

**Status:** ready-for-agent

**ui 观感：** 局部编辑局部脏；改一格 ≠ 满屏表 diff。

- [ ] Edit one cell → other untouched tables keep original bytes in host/git diff
- [ ] Untouched non-table spans likewise stable across intentional local edit
- [ ] Only authored intent appears in diff fixtures (product invariants 2–3)
- [ ] No second document model / preview / greenfield 0007–0014
- [ ] git/diff fixtures + Light smoke on markdownViewer; build green

## Comments
