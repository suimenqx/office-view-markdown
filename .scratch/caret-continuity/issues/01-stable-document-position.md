# 01: Stable document position model

**What to build:** ADR 0010 stable document position. Define (or harden) a logical caret/selection identity for every editable block and inline object—prose, task/list structure, embedded CodeMirror, sibling special blocks—independent of presentation-tree paths and aggregate `textContent` counts. Map to DOM `Range` or CodeMirror block index/offset only at the interaction edge. Lute re-render, `wbr`/marker cleanup, lazy CM mount/teardown, and preview↔edit toggles must preserve logical caret/selection and direction; remounts must not collapse the caret to block top or invent a second focus. Stay inside ADR 0004 (no second surface).

**Blocked by:** None (can start after product lock); coordinate with 02/03 so keyboard boundaries and focus-token chrome land on the same position model.

**Status:** ready-for-agent

**ui 观感：** 重挂后选区一次落稳；勿「先跳块顶再归位」；进/出嵌入块勿叠第二焦点环。

- [ ] Logical document position covers prose, task/list, CM, and special blocks touched by caret/keyboard
- [ ] Re-render / lazy CM mount-teardown / preview↔edit: logical caret + direction preserved
- [ ] Presentation remount does not collapse caret to block top
- [ ] Unit coverage for position round-trip across remount seams; build green
