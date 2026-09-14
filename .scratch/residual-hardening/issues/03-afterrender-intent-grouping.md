# 03: afterRender prose intent grouping

**What to build:** ADR 0014 residual (3) / ADR 0009 leftover. Prose edits that still record through debounced `afterRenderEvent` → `recordHistory` must group as **one ADR 0009 intent**: one undo unit, one dirty pulse for one typing burst (not letter-by-letter extra steps, not delay+blur double-dirty). Do **not** invent a second coordinator or reopen semantic-edit-tx as greenfield—harden grouping on the remaining afterRender path (`wysiwyg/input.ts` + `afterRenderEvent.ts`). Presentation-only remounts stay out of history (0009 already closed).

**Blocked by:** Forge sequence after 01/02; no hard code block (independent residual). Consume ADR 0009 `commitAuthoredEdit` as the canonical boundary where a path can move off debounce.

**Status:** ready-for-agent

**ui 观感：** afterRender 散文路径按一意图分组（一次 undo / 一次 dirty）。

- [ ] A single prose intent via afterRender debounce = one undo unit / one dirty pulse
- [ ] Ctrl+Z undoes that burst once; no double-dirty from delay+blur
- [ ] No second transaction coordinator; 0009 contract consumed not rewritten
- [ ] Presentation-only remounts still invent zero history
- [ ] Light GUI SMOKE (extend semantic-edit-tx family) + unit where seams allow; build green

## Comments
