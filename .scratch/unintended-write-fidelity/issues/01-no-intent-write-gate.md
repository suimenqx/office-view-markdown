# 01: No-intent write gate / source fingerprint

**What to build:** ADR 0015 residual (1). Paths that call `getMarkdown()` + host `save` / `updateTextDocument` **without** an ADR 0009 authored intent must not rewrite the on-disk document. Strengthen the host equality gate beyond `\r`-only strip: skip write-back when content is byte-equivalent in intent to the last known source (source fingerprint / last-authored snapshot). Cover cold open (`enableInput: false` already OK) and especially passive `afterRender` that currently serializes and saves. Prefer skip-or-preserve; do not invent a second preview or auto-pretty feature. Prove on `office-view-markdown.markdownViewer` with a no-edit → still-clean fixture.

**Blocked by:** None (forge starts here). 02/03 depend on having a trustworthy no-intent gate; sequence 01 → 02 → 03.

**Status:** ready-for-agent

**ui 观感：** 无编辑时不 dirty 闪烁 / 文件不变脏。

- [ ] Passive afterRender / open-without-edit does not dirty host document or flash dirty
- [ ] Write skipped (or bytes unchanged) when no ADR 0009 intent; stronger than `\r`-only equality
- [ ] Cold open enableInput false remains clean; intentional edits still save
- [ ] No second preview / pretty-format-as-feature
- [ ] Light smoke + unit/git-diff fixture where seams allow; build green

## Comments
