# 01: Find focus while typing (no steal / no body pollute)

**What to build:** ADR 0014 residual (1) / ADR 0011 leftover. While the existing FindBar query (or replace) field is focused, keystrokes stay in that field: focus must **not** be stolen into CodeMirror (lazy mount / reveal / `scheduleRestoreFindFocus` fight), and typed characters must **not** mutate the authored document body. Prove this on `office-view-markdown.markdownViewer` Light—not xvfb-only. Reuse existing FindBar chrome (no skin). Keep ADR 0011 index / count / replace contracts intact; do not reopen semantic-find as greenfield.

**Blocked by:** None (forge starts here). Coordinate with 02/03 only as wave sequence, not a code DAG.

**Status:** ready-for-agent

**ui 观感：** Find 输入不抢焦点、不污染正文。

- [x] Query typing keeps focus in FindBar; CM mount/search does not steal caret
- [x] Keystrokes while Find is focused do not write into document body / Markdown
- [x] ADR 0011 count / navigate / replace contracts unchanged
- [x] No FindBar skin / second Find UI
- [x] Light GUI SMOKE (extend semantic-find family) + unit where seams allow; build green

## Comments

- 2026-09-14 (Asia/Shanghai): Added pure Find focus ownership guards, skipped prose/CodeMirror focus moves while Find or Replace owns focus, stopped Find key events from reaching editor handlers, and extended the semantic-find Light smoke checklist. Focused unit and build verification passed.
