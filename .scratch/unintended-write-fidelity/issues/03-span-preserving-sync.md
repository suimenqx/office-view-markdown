# 03: Dirty-region / span-preserving sync

**What to build:** ADR 0015 residual (3). When the user edits one table cell (or one intentional span), write-back must not rewrite **every** table / untouched block in the file. Preserve original source bytes for spans outside the dirty region so git/diff shows only what the user changed. Build on 01 (intent gate) + 02 (table serialize fidelity): either dirty-region merge, span-preserving sync, or equivalent — do **not** invent a second document model or preview surface. Acceptance: edit one cell in a multi-table fixture → only intentional change appears in diff; other tables byte-identical to open.

**Blocked by:** Forge sequence after 01 → 02; uses no-intent gate + table preserve evidence. Prefer extend existing afterRender / updateTextDocument / ADR 0009 commit paths.

**Status:** done

**ui 观感：** 局部编辑局部脏；改一格 ≠ 满屏表 diff。

- [x] Edit one cell → other untouched tables keep original bytes in host/git diff
- [x] Untouched non-table spans likewise stable across intentional local edit
- [x] Only authored intent appears in diff fixtures (product invariants 2–3)
- [x] No second document model / preview / greenfield 0007–0014
- [x] git/diff fixtures + Light smoke on markdownViewer; build green

## Comments

- 2026-09-15 (UTC): Added line-preserving source spans and an LCS merge for
  unchanged blocks/tables. An edited table is allowed to serialize its own
  intentional span while unrelated authored bytes are spliced back into the
  candidate document.
- Verification: `spanPreservingSync.test.js` with a one-cell edit and a
  second table/prose fixture; complete unit suite and build pass.
