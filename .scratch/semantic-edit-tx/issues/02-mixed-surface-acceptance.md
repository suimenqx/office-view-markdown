# 02: Mixed-surface acceptance slice + undo/redo/dirty/save

**What to build:** ADR 0009 first acceptance slice on `office-view-markdown.markdownViewer` only: **prose → code → task → link/HTML → undo/redo → save**. Each step is one intent/one undo unit/one dirty; undo/redo round-trips Markdown and restores a stable document position after the commit; save matches visible document and clears dirty once. No FindBar rewrite, no async-render generation ship—those consume this contract later.

**Blocked by:** Prefer land with or after 01 (needs the coordinator / no-render-history boundary).

**Status:** ready-for-agent

**ui 观感：** Ctrl+Z 跨面回退选区一次落稳，勿先跳块顶再归位；进出嵌入块无第二焦点环。

- [ ] Prose edit → one commit / undo / dirty
- [ ] CodeMirror code edit → same contract (not a divergent private stack for document Ctrl+Z)
- [ ] Task (or list) toggle → same contract
- [ ] Link or HTML popover edit → same contract
- [ ] Undo through the mixed sequence in intent order; redo as applicable; stable position restored
- [ ] Save: on-disk Markdown matches; dirty clears once; remount-only work does not re-dirty
- [ ] Manual SMOKE note + build/suite green
