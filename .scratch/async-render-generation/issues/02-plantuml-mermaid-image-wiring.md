# 02: PlantUML / Mermaid / image path wiring

**What to build:** ADR 0013 wire the existing PlantUML, Mermaid, and image load/render paths through the issue-01 generation guard. Theme refresh and special-block remount must bump or invalidate the tuple so in-flight results for a superseded generation do not write. Replace closure-captured element lists / source snapshots as the product commit path with “current identity + current revision + current config.” Keep ADRs 0001–0002 closed (no default public PlantUML server, no silent probing). Acceptance on `office-view-markdown.markdownViewer` only.

**Blocked by:** Prefer land with or after 01 (needs generation token / revision guard).

**Status:** ready-for-agent

**ui 观感：** 主题切换 / 块重挂载中途无旧图闪一下；三路径同一套代际语义，勿 Mermaid 有守卫、PlantUML 仍闭包写回。

- [ ] Mermaid render path commits only under current generation guard
- [ ] PlantUML render path commits only under current generation guard
- [ ] Image load path commits only under current generation guard
- [ ] Theme refresh / remount invalidates superseded in-flight results
- [ ] Manual SMOKE note + build/suite green

## Comments
