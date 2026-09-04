# 01: Fix chips Frontmatter multi-value display

**What to build:** In chips Frontmatter Presentation, short multi-value fields (e.g. tags lists) show all authored values in compact form—no `display:none` on list tails that drops metadata the user wrote.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Chips mode no longer hides non-first list items of multi-value frontmatter
- [ ] Compact layout still uses Codicon; default remains table
- [ ] Switching table ↔ chips does not corrupt frontmatter source
- [ ] Focused test or fixture covers multi-value tags (or equivalent)
