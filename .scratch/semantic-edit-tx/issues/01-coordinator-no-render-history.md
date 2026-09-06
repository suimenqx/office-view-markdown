# 01: Coordinator / transaction boundary + no render history

**What to build:** ADR 0009 transaction boundary. Introduce or harden a coordinator so authored mutations (DOM prose, CodeMirror, task/list, link/HTML, and any special-block source edit already in path) commit through one canonical Markdown mutation API: one intent → one commit, one undo unit, one dirty/save. Presentation-only work—render remounts, lazy CodeMirror mount/teardown, diagram/image refresh, outline chrome—must never push history or pulse a second dirty. Focus must not be the history-routing signal. Stay inside ADR 0004 (no second surface).

**Blocked by:** None (can start after product lock); coordinate with 02/03 so acceptance slice and single-stack wiring land on the same boundary.

**Status:** ready-for-agent

**ui 观感：** 事务不可见为“第二编辑器”；remount 不得闪 dirty。

- [ ] Canonical commit path owns Markdown snapshot + dirty notification
- [ ] Remount / lazy CM mount-teardown / diagram refresh / outline chrome: zero history, zero extra dirty
- [ ] Focus change alone does not create undo steps or switch stack ownership
- [ ] Unit coverage for commit vs presentation-only paths; build green
