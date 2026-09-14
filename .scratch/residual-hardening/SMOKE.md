# SMOKE — ADR 0014 residual hardening

Acceptance surface: `office-view-markdown.markdownViewer` only. This wave
extends the existing [semantic-find](../semantic-find/SMOKE.md),
[inline-object-activation](../inline-object-activation/SMOKE.md), and
[semantic-edit-tx](../semantic-edit-tx/SMOKE.md) families; it does not add a
second editor, preview, Find UI, popover family, or transaction coordinator.

## Light must-fix checklist

- **Find typing isolation:** type a query rapidly in the existing FindBar (and
  Replace field) while a prose and fenced-code match are present. Focus and the
  selection range stay in FindBar; CodeMirror does not steal focus; the
  authored body remains unchanged. See semantic-find step 0.
- **Popover continuous GUI path:** plain-click an ordinary link, edit, Save, and
  verify one `linkHtml` undo/dirty commit followed by one ADR 0010 focus return
  on the object. Repeat wiki/image/HTML where wired. See
  inline-object-activation “Continuous GUI path (Light must-fix)”.
- **afterRender prose intent:** type one prose burst, wait for idle, and press
  Ctrl+Z once. The burst is one undo unit / one dirty pulse, with no
  delay-plus-click duplicate. See semantic-edit-tx steps 3–4.

## Residual scope

Dark/HC harness debt and the previously documented B-list GUI automation gaps
remain secondary for this wave. No push is part of acceptance.
