# 02: Table wrapper rounded clipping

**What to build:** Tables get a real wrapper (or equivalent structure) so radius + overflow clipping rounds corners reliably, while keeping header emphasis and row hover. WYSIWYG table editing must keep working.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Rounded corner clipping works with cell borders (wrapper or proven equivalent)
- [x] Header emphasis and row hover retained via Design Tokens
- [x] Table editing / structure round-trip not broken

**Comments:** Added `vditor-table-wrapper` presentation wrap (`tableWrapper.ts`) with radius/overflow/shadow on the wrapper; export clone unwraps. Sibling TABLE navigation uses `isTableBlockElement`/`resolveTableElement`. Covered by `test/unit/tableWrapper.test.js`.
