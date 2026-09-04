# 04: GitHub Alerts presentation

**What to build:** Blockquotes marked with GitHub-style alert markers ([!NOTE], [!TIP], [!WARNING], [!CAUTION], [!IMPORTANT], and agreed variants) render as GitHub Alerts with semantic colors. Ordinary blockquotes stay as today. Markdown source is not rewritten on edit round-trip. No new Callout block type or toolbar inserter.

**Blocked by:** 01 Design Tokens foundation

**Status:** ready-for-agent

- [ ] Alert markers receive semantic alert classes / styling
- [ ] Non-alert blockquotes unchanged
- [ ] Edit round-trip preserves original Markdown (presentation-only; ADR 0005)
- [ ] Pure-function or equivalent seam maps marker → class and is unit-tested
