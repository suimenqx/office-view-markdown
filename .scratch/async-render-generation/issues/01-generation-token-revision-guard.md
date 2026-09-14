# 01: Generation token / revision guard

**What to build:** ADR 0013 generation guard. Model each async-rendered block as `(stable block identity, source revision, renderer/theme config)`. Introduce a generation token (or equivalent) so an async result may commit SVG/img/error chrome **only** when that tuple is still current and the host element is connected. Supersede / dispose prior generation state when identity, source, or theme/config changes. Prefer one shared guard over per-path `data-processed` markers as the sole ownership model. Stay inside ADR 0004 (no second surface). Render commit / dispose must not invent ADR 0009 undo history and must not move ADR 0010 focus.

**Blocked by:** None (can start after product lock); coordinate with 02/03 so PlantUML/Mermaid/image wiring and Retry land on the same guard.

**Status:** ready-for-agent

**ui 观感：** 无陈旧闪现——代际切换先丢弃旧 chrome，再提交新结果；loading/ready/error 互斥。

- [ ] Tuple `(block identity, source revision, theme/config)` owned per render request
- [ ] Async commit gated on tuple still-current + host connected
- [ ] Prior generation disposable; no duplicate lifecycle chrome
- [ ] Commit / dispose do not invent undo or steal focus anchor
- [ ] Unit coverage for allow/deny commit + connected check; build green

## Comments
