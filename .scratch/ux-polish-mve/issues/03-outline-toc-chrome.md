# 03: Outline / TOC chrome

**What to build:** Outline reads as an on-this-page navigator: localized header (e.g. 本页目录), active item with left accent bar and light background. Existing collapse / narrow-screen behavior and scroll-offset algorithm remain. Headings gain scroll-margin-top aligned with that offset. Outline clicks do not use default smooth scrolling.

**Blocked by:** 01 Design Tokens foundation

**Status:** ready-for-agent

- [ ] Outline header is i18n’d (including Chinese 本页目录)
- [ ] Active outline item shows left accent + subtle background using Design Tokens
- [ ] scroll-margin-top on headings aligns with existing outline scroll offset
- [ ] No default smooth scroll on outline navigation
- [ ] Collapse / narrow-screen outline behavior unchanged
