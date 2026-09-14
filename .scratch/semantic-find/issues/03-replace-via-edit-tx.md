# 03: Replace via edit-tx + position restore

**What to build:** ADR 0011 Replace Current / Replace All. Commit replacements through the ADR 0009 transaction boundary: one Replace Current intent → one undo unit; one Replace All intent → one undo unit (predictable grouping—not a mixed DOM/CM history surprise). After replace, restore caret/selection via ADR 0010 document position. Replacement mutates through the canonical Markdown commit path, not divergent DOM-range vs CodeMirror-view write paths that disagree with Find's source ranges. Stay inside ADR 0004; no second preview / Welcome / LLM.

**Blocked by:** Prefer land with or after 01 (source ranges) and alongside 02 (same FindBar session / current-match cursor).

**Status:** ready-for-agent

**ui 观感：** Replace 走 0009 一次 dirty/undo；跳转落稳同 Find。

- [ ] Replace Current: one ADR 0009 undo unit; position restore via ADR 0010
- [ ] Replace All: one ADR 0009 undo unit for the command; count/index stay coherent
- [ ] Replacement uses shared source ranges (same identity as Find), not divergent DOM/CM mutation paths
- [ ] No render-only history / extra dirty from reveal mounts during replace
- [ ] Unit + SMOKE: replace + undo + position; build green
