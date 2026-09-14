# 01: Shared document-target contract

**What to build:** ADR 0012 shared **document-target** model. Every link-like inline object—ordinary link, link reference, wiki link, image, raw HTML island—exposes one target object carrying: target kind, display vs destination distinction (source ranges), activation action, editable fields, host-open action, and focus anchor. Prefer this shared contract over distributed policy in WYSIWYG toolbar, `linkClick`, provider wiki handling, and HTML editor. Stay inside ADR 0004 (no second surface). Focus-anchor identity must be expressible for ADR 0010 restore; mutation commit path must be expressible for ADR 0009.

**Blocked by:** None (can start after product lock); coordinate with 02/03 so activation paths and wiki/HTML parity land on the same target model.

**Status:** ready-for-human

**ui 观感：** 点击语法统一——同类对象同一套手势，勿一类单击跳、一类必须双击。

- [x] Document-target type covers link / link-ref / wiki / image / HTML
- [x] Display vs destination (source ranges) explicit on the target
- [x] Activation + editable fields + host-open + focus anchor fields present
- [x] No second preview / Welcome / LLM surface introduced
- [x] Unit coverage for target identity across re-render/replace seams where pure; build green

## Comments
- 2026-09-14 20:16 CST: Landed shared `documentTarget` model (kind, display/destination ranges, activation table, editable fields, host-open, ADR 0010 focus anchor). Adapters in `linkClick` / toolbar / HTML. Unit: `test/unit/documentTarget.test.js`.
