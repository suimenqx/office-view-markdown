# 01: First paint — 首屏不闪 + 字号一次到位

**What to build:** ADR 0008 invariants **首屏不闪** and **字号一次到位**. Opening `office-view-markdown.markdownViewer` must not flash wrong theme, wrong Editor Font Size, or stock/empty Vditor layout. Resolve VS Code–affine chrome (theme + `--editor-font-size`, and viewer settings when enabled) before the Reading Surface is user-visible; hold/hide shell until ready. First frame uses Editor Font Size — no default→override jump. Stay inside ADR 0004 (no remote fonts, no second surface).

**Blocked by:** None (can start after product lock); coordinate with 02 on `after()` ordering so restore does not reintroduce a flash.

**Status:** done

**ui 观感：** 宁可晚一帧完整 Reading Surface；首帧字号到位；拒骨架屏/Welcome/第二预览。

- [x] Light/Dark(/HC): first visible frame matches resolved editor theme (not stock default then jump) — 首屏不闪
- [x] Editor Font Size (follow `editor.fontSize` or explicit 12–28) applied on first frame — 字号一次到位
- [x] No empty/`#vditor` stock chrome flash on cold open
- [x] `applyViewerSettings` (when sync enabled) does not cause a second visible layout jump after reveal
- [x] Build + unit/boot guard tests green
