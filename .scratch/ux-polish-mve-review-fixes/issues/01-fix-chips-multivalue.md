# 01: Fix chips Frontmatter multi-value display

**What to build:** In chips Frontmatter Presentation, short multi-value fields (e.g. tags lists) show all authored values in compact form—no `display:none` on list tails that drops metadata the user wrote.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Chips mode no longer hides non-first list items of multi-value frontmatter
- [x] Compact layout still uses Codicon; default remains table
- [x] Switching table ↔ chips does not corrupt frontmatter source
- [x] Focused test or fixture covers multi-value tags (or equivalent)

**Comments:** Removed the chips CSS rule that hid `li:not(:first-child)` and allowed tag/alias lists to wrap so all authored values stay visible. Presentation still only toggles DOM classes (source unchanged). Covered by `test/unit/frontMatterPresentation.test.js`.
