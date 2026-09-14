# 02: Activation / edit / focus-return paths

**What to build:** ADR 0012 deterministic activation and edit paths on the shared document-target (issue 01). Wire click / modifier / double-click / Alt+Enter (gesture table provisional until Studio notes) so the same kind → same action under one contract. Edits (link href, image src/alt, etc.) commit through **ADR 0009** (one intent → one undo/dirty). After save or cancel, restore focus via **ADR 0010** focus anchor—not surviving DOM node identity alone. Do not invent a new chrome skin; theme-affine hover/focus affordances only. Acceptance on `office-view-markdown.markdownViewer` only.

**Blocked by:** Prefer land with or after 01 (needs shared document-target).

**Status:** ready-for-agent

**ui 观感：** 修饰键可见（Cmd/Ctrl+Click 不闪编辑环）；回焦一次落回对象，勿段首/块顶。

- [ ] Activation policy uses document-target (not ad-hoc per-file click grammar as product truth)
- [ ] Edit save: one ADR 0009 undo/dirty unit; no render-only history from node rewrite
- [ ] Post-save / cancel focus return via ADR 0010 anchor
- [ ] Focus anchor survives remove/re-render used by save path
- [ ] Manual SMOKE note + build/suite green
