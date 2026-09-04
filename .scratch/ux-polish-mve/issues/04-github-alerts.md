# 04: GitHub Alerts presentation

**What to build:** Blockquotes marked with GitHub-style alert markers ([!NOTE], [!TIP], [!WARNING], [!CAUTION], [!IMPORTANT], and agreed variants) render as GitHub Alerts with semantic colors. Ordinary blockquotes stay as today. Markdown source is not rewritten on edit round-trip. No new Callout block type or toolbar inserter.

**Blocked by:** 01 Design Tokens foundation

**Status:** ready-for-human

- [x] Alert markers receive semantic alert classes / styling
- [x] Non-alert blockquotes unchanged
- [x] Edit round-trip preserves original Markdown (presentation-only; ADR 0005)
- [x] Pure-function or equivalent seam maps marker → class and is unit-tested

**Comments:** Added presentation-only GitHub Alert class mapping for NOTE, TIP, WARNING, CAUTION, and IMPORTANT markers, with semantic info/success/warning/error styling. The marker text and Markdown conversion path are untouched; ordinary blockquotes receive no alert class. Verified with `node test/unit/githubAlerts.test.js` and `npm run build`.
