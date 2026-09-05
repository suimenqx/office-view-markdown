# 01: Outline ellipsis, hover full title, wider default

**What to build:** Outline labels use single-line ellipsis; hovering shows the full heading title. Default Outline width is about 280px (breakpoints adjusted if needed). Drag-resize and persisted width remain. Outline list no longer requires horizontal scrolling to read labels.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Long outline labels show ellipsis (not mid-glyph clip without ellipsis)
- [x] Hover exposes full title (`title` or equivalent tip)
- [x] Default width ~280px; resize 120–480 and memory still work
- [x] No horizontal-scroll-as-primary for outline labels (`max-content` list width fixed)
- [x] Active/scroll-spy/collapse behavior unchanged; build + focused test pass
