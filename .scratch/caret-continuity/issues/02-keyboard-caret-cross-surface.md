# 02: Keyboard / caret continuity across prose ↔ CM

**What to build:** ADR 0010 boundary keyboard and mouse enter/leave. Arrow / Home / End / Enter / Backspace (and related boundary keys) across prose, task/list structure, and embedded CodeMirror (plus sibling special blocks) must have deterministic behavior—one continuous editor feel while the document stays open. Crossing an object must not require a second action to enter, lose the expected side of a selection, or trap Tab into chrome. Viewport follows the selection in **one** motion on boundary Arrow/Home/End—no jump-to-block-top then rehome. Mouse enter/leave of embedded surfaces follows the same position contract (no double-click-block-edge required to enter edit). Acceptance on `office-view-markdown.markdownViewer` only.

**Blocked by:** Prefer land with or after 01 (needs the stable document position model).

**Status:** ready-for-agent

**ui 观感：** Arrow/Home/End 跨界视口一次跟随选区；拒双击块边进入编辑；拒 Tab 困进 chrome。

- [x] Arrow / Home / End across prose↔CM (and task/list / special-block) boundaries: deterministic, one viewport follow
- [x] Enter / Backspace at boundaries: no lost selection side, no unexpected collapse to nearby block
- [x] Mouse enter/leave embedded surface uses same position contract (no double-click edge to edit)
- [x] Tab does not trap into chrome
- [x] Manual SMOKE note + build/suite green
