# 01: Document search index / shared source ranges

**What to build:** ADR 0011 searchable stream. Build (or harden) a document-level search index over the canonical authored Markdown/document map—not a dual DOM walk + separate CodeMirror scan. Matches share one **source-range** identity across prose, inline markup (emphasis/link and siblings), and embedded code/math source. Crossing inline boundaries must not drop a hit. Presentation chrome, hidden, and aria-hidden nodes stay out of the searchable stream by policy (not ad-hoc skip lists alone). Index identity must be stable when a block is later mounted only to reveal a hit. Stay inside ADR 0004 (no second surface).

**Blocked by:** None (can start after product lock); coordinate with 02/03 so FindBar navigation and Replace land on the same index + source-range model.

**Status:** ready-for-agent

**ui 观感：** 计数诚实——索引命中数 = Find 展示计数；挂载不得改集。

- [ ] Authored-stream index covers prose, cross-inline markup, embedded code/math source ranges
- [ ] Presentation chrome / hidden / aria-hidden excluded by policy
- [ ] Match spanning emphasis/link (sibling inline) boundaries is one hit
- [ ] Index / result-set identity stable across reveal-only mount
- [ ] Unit coverage for source-range hits + exclusion policy; build green
