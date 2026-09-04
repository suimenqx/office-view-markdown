# 06: Frontmatter Presentation (table | chips)

**What to build:** Frontmatter Presentation setting chooses table or chips; default remains editable table. Chips mode shows compact Codicon + key/value for short metadata without removing editability of Properties.

**Blocked by:** 01 Design Tokens foundation

**Status:** ready-for-human

- [x] Setting supports `table | chips` with default `table`
- [x] Chips mode uses Codicon (no emoji icons)
- [x] Table/Properties editing path remains available and default
- [x] Switching modes does not corrupt frontmatter source

**Comments:** Added the `office-view-markdown.frontMatterPresentation` setting with a `table` default and a `chips` mode that lays out short YAML properties as compact Codicon-backed chips while retaining the existing Edit YAML path. The presentation is applied after WYSIWYG/IR renders and mode switches, and only changes DOM classes; YAML source remains synchronized through the existing hidden source node. Verified with `node test/unit/frontMatterPresentation.test.js` and `npm run build`.
