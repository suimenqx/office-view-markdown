# Code review summary — tickets 04–10

Fixed point: `d4c0007` (end of ticket 03) → `HEAD` (`c292370` at review time).
Axes: Standards + Spec (Matt `$code-review`). Full write-ups: `04-10-standards.md`, `04-10-spec.md`.

## Standards

No hard documented-standard breaches. Strongest judgement smells: duplicated IR/WYSIWYG alert refresh, repeated Md→DOM mount triad, over-broad `removeActionableEmptyState`. Softer: image-error Feature Envy, duplicated alert LESS, `frontMatterPresentation.ts` under `codeBlock/`.

**Worst within Standards:** duplicated Md→DOM / alert-scope wiring (extract before next presentation pass).

## Spec

Most of 04/05/06-setting/07/09/10 and ADRs 0003–0005 match. Gaps: table wrapper clipping incomplete; smoke alerts only NOTE+WARNING; figcaption on any non-empty alt. Creep: always-wrap `<figure>`; chips hide multi-value list tails. Wrong-looking: figure-in-`<p>` editing risk; chips omit authored multi-values.

**Worst within Spec:** chips mode hiding multi-value frontmatter tails + figure wrap / table-wrapper clipping gaps.

## Totals

- Standards: 0 hard / ~7 judgement smells (3 strong)
- Spec: 3 missing-partial / 2 creep / 3 looks-wrong

No product code changed in this review pass.
