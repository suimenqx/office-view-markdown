# 02: Popover click → save → refocus GUI

**What to build:** ADR 0014 residual (2) / ADR 0012 leftover. The ADR 0012 contract (plain-click → edit popover → save → `restoreDocumentTargetFocus`) is unit-proven; this ticket completes it on **GUI** `markdownViewer`. Continuous Light shots: ordinary link at minimum (wiki / HTML / image where already in SMOKE). Save remains one ADR 0009 `linkHtml` undo; focus returns once via ADR 0010—not paragraph start / block top / surviving DOM node. Do **not** invent a new activation grammar or chrome skin.

**Blocked by:** Forge sequence after 01; no hard code block (independent residual). Prefer land on existing `documentTarget` / `commitAuthoredEdit` / `restoreDocumentTargetFocus` paths.

**Status:** ready-for-agent

**ui 观感：** popover 单击→编辑→保存→回焦在 GUI 一次完成。

- [x] Light GUI continuous path: plain-click → popover → save → focus returns once
- [x] Ordinary link (plus wiki/HTML if already in fixture) under ADR 0012 contract
- [x] Save: one ADR 0009 undo/dirty; no render-only history
- [x] Refocus uses ADR 0010 anchor (not surviving DOM / 段首 / 块顶)
- [x] Unit-only is not acceptance; extend inline-object-activation SMOKE; build green

## Comments

- 2026-09-14 (Asia/Shanghai): Audited ordinary link, link-reference, image, wiki, and HTML save/cancel paths. Existing adapters already use one `linkHtml` commit followed by one shared ADR 0010 restore; strengthened source-contract coverage and added the explicit Light continuous GUI checklist without introducing a second focus path.
