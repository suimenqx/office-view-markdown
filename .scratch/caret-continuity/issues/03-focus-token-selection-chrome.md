# 03: Focus-token + selection chrome (one family)

**What to build:** ADR 0010 visual contract with ui. One focus token when entering/leaving code (and sibling embedded surfaces)—no “surface selected + CM inner ring” stack. Cross-surface drag and Shift+Arrow highlight stay the **same family**—not system-blue vs theme-color split. No new skin; FindBar is a consumer only (does not get a rewrite or restyle in this wave). Honor Studio anti-cases: double-click block edge to enter edit; Tab trap into chrome.

**Blocked by:** Prefer land with or after 01 (position model); implement alongside or immediately after 02 so keyboard boundary work does not reintroduce a second ring or highlight split.

**Status:** ready-for-agent

**ui 观感：** 进/出 code 仅一套 focus；跨面拖选/Shift+Arrow 同族高亮；拒系统蓝 vs 主题色分裂；FindBar 只消费、不开新皮。

- [ ] Entering/leaving code (and sibling embeds): one focus token only — no surface + inner CM ring stack
- [ ] Cross-surface drag / Shift+Arrow highlight: one family (theme-affine), not system-blue vs theme-color split
- [ ] No FindBar rewrite or new selection skin
- [ ] Light/Dark(/HC) smoke optional for focus-ring / highlight 观感; build green
