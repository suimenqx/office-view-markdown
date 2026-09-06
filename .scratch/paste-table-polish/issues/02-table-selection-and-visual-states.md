# 02: Table cell selection stability + visual states

**What to build:** Enter/leave cell and multiline in-cell edit keep stable caret/selection (ADR 0007). Visual states: cell focus, row/col active, dragging — token-aligned; no Excel chrome. Hover must not override active.

**Blocked by:** None (can start immediately) — coordinate with 01 if shared table paste fixtures help

**Status:** ready-for-agent

- [ ] Multiline cell edit does not swallow newlines or jump selection unpredictably
- [ ] Cell focus ring / row-col active wash / dragging opacity+drop-line per ui decision
- [ ] Existing table handle insert/delete/align still work
- [ ] Light/Dark(/HC) readable; build + unit tests pass
