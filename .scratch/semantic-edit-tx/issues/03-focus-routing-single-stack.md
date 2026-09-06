# 03: Focus-routing removal / single undo stack wiring

**What to build:** Remove or neutralize focus-based Ctrl+Z ownership so embedded CodeMirror (and popover) history cannot diverge from the document stack. Wire a single undo/redo command path to the ADR 0009 coordinator: document-level undo/redo always pops/pushes semantic transactions, regardless of whether focus is in prose, CM, or chrome. May keep ephemeral CM internal undo only if it cannot leak as a competing document Ctrl+Z or double-commit on blur/`undoDelay`.

**Blocked by:** 01 (coordinator); implement alongside or immediately after 02 so the acceptance slice proves one stack.

**Status:** ready-for-agent

**ui 观感：** 焦点进出嵌入块无“换了一套撤销”；无第二焦点环暗示第二历史。

- [ ] Document Ctrl+Z / redo ignores focus as ownership signal
- [ ] No double-commit from CM sync-on-delay + sync-on-blur for one intent
- [ ] Outer undo does not “eat” an intent already represented, and does not no-op when an intent remains
- [ ] Unit/host checks for focus-in-CM vs focus-in-prose same undo policy; build green
