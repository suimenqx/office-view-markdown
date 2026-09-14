# 02: FindBar consume index + navigation

**What to build:** ADR 0011 Find / Find Next / Find Previous on the existing FindBar. Wire FindBar to consume the document search index (issue 01)—one honest document-wide match count, not DOM count + separate CM count. Navigate-to-match maps source ranges to rendered position (consume ADR 0010); may mount a block to show the hit, but mounting must not change the result set or count. **Reuse existing FindBar chrome** — no skin redesign. Match highlight: theme-affine (provisional until ui Studio notes). Acceptance on `office-view-markdown.markdownViewer` only.

**Blocked by:** Prefer land with or after 01 (needs shared source-range index).

**Status:** ready-for-agent

**ui 观感：** 高亮同族；Find Next/点选一次落稳（ADR 0010 文档位）。

- [ ] FindBar consumes document index; single honest match count
- [ ] Find Next / Previous across prose + inline + embedded code/math
- [ ] Reveal mount does not add/remove/reorder hits or change count
- [ ] Navigate-to-match uses ADR 0010 document position
- [ ] No FindBar skin redesign; chrome reused
- [ ] Manual SMOKE note + build/suite green
