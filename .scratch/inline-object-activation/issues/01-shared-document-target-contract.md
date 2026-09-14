# 01: Shared document-target contract

**What to build:** ADR 0012 shared **document-target** model. Every link-like inline object—ordinary link, link reference, wiki link, image, raw HTML island—exposes one target object carrying: target kind, display vs destination distinction (source ranges), activation action, editable fields, host-open action, and focus anchor. Prefer this shared contract over distributed policy in WYSIWYG toolbar, `linkClick`, provider wiki handling, and HTML editor. Stay inside ADR 0004 (no second surface). Focus-anchor identity must be expressible for ADR 0010 restore; mutation commit path must be expressible for ADR 0009.

**Blocked by:** None (can start after product lock); coordinate with 02/03 so activation paths and wiki/HTML parity land on the same target model.

**Status:** ready-for-agent

**ui 观感：** 点击语法统一——同类对象同一套手势，勿一类单击跳、一类必须双击。

- [ ] Document-target type covers link / link-ref / wiki / image / HTML
- [ ] Display vs destination (source ranges) explicit on the target
- [ ] Activation + editable fields + host-open + focus anchor fields present
- [ ] No second preview / Welcome / LLM surface introduced
- [ ] Unit coverage for target identity across re-render/replace seams where pure; build green
