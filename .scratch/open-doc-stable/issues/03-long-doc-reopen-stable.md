# 03: Long-doc settle — same ADR 0008 contract

**What to build:** On long documents (multi-screen, code blocks with lazy mount), open + restore must satisfy the same ADR 0008 contract (首屏不闪 / 字号一次到位 / 滚位/光标可恢复) without a visible scroll-from-top or a late layout jump that undoes restore. May adjust restore scheduling after layout-affecting mounts; must not invent a second preview or change semantic transactions.

**Blocked by:** 01 + 02 (uses their first-paint and restore contract)

**Status:** done

- [x] Long fixture: reopen keeps viewport ≈ saved scroll (no obvious top flash then jump)
- [x] Lazy CodeMirror mount near restore target does not visibly shove scroll after settle
- [x] Outline/wiki `pendingFragment` open still overrides session scroll
- [x] Manual SMOKE-OPEN note for long doc; build + suite green
