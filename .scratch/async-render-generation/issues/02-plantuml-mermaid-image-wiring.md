# 02: PlantUML / Mermaid / image path wiring

**What to build:** ADR 0013 wire the existing PlantUML, Mermaid, and image load/render paths through the issue-01 generation guard. Theme refresh and special-block remount must bump or invalidate the tuple so in-flight results for a superseded generation do not write. Replace closure-captured element lists / source snapshots as the product commit path with “current identity + current revision + current config.” Keep ADRs 0001–0002 closed (no default public PlantUML server, no silent probing). Acceptance on `office-view-markdown.markdownViewer` only.

**Blocked by:** Prefer land with or after 01 (needs generation token / revision guard).

**Status:** done

**ui 观感：** 三态互斥——loading/ready/error 不叠层。

- [x] Mermaid render path commits only under current generation guard
- [x] PlantUML render path commits only under current generation guard
- [x] Image load path commits only under current generation guard
- [x] Theme refresh / remount invalidates superseded in-flight results
- [x] Manual SMOKE note + build/suite green

## Comments
