# 03: Outline / TOC chrome

**What to build:** Outline reads as an on-this-page navigator: localized header (e.g. 本页目录), active item with left accent bar and light background. Existing collapse / narrow-screen behavior and scroll-offset algorithm remain. Headings gain scroll-margin-top aligned with that offset. Outline clicks do not use default smooth scrolling.

**Blocked by:** 01 Design Tokens foundation

**Status:** done

- [x] Outline header is i18n’d (including Chinese 本页目录)
- [x] Active outline item shows left accent + subtle background using Design Tokens
- [x] scroll-margin-top on headings aligns with existing outline scroll offset
- [x] No default smooth scroll on outline navigation
- [x] Collapse / narrow-screen outline behavior unchanged

**Comments:** Added a separate localized outline-header key with fallback compatibility, using `本页目录` for Simplified Chinese and “On this page” for English. Active outline items now use the shared info token for an inset left accent and semantic background mix; headings use the shared 15px outline scroll offset. Existing click positioning, collapse persistence, scroll spy, and mobile drawer behavior remain unchanged. Verified with `node test/unit/outlineLabel.test.js` and `npm run build`.
