# Spec: 「文档语义查找」 / Document-semantic Find & Replace

Status: ready-for-agent

## Problem Statement

Find, Find Next, Replace, and Replace All in `office-view-markdown.markdownViewer` do not share one document-wide semantic operation. FindBar searches DOM text nodes with a skip selector that excludes `code`, `.cm-editor`, chrome, hidden, and aria-hidden content, then searches code/math blocks separately through CodeMirror or their source text. DOM matches use node paths and per-node offsets; CodeMirror matches use block-local offsets. A match spanning two inline nodes cannot be found by the DOM pass. Replace and Replace All mutate DOM ranges and CodeMirror views through different paths, so count and undo can disagree with what the author sees as one document.

Users expect a document search count and Replace All to mean the same thing everywhere authored text appears. The current split makes scope depend on markup and block type: text split by emphasis/link/HTML boundaries is not one searchable stream; inline code is omitted from the DOM pass; CodeMirror matches may mount during replacement; mixed replacement can produce a different undo boundary from a single-surface replacement. Architect pain #3 (P1) and locked **ADR 0011** name this as the next polish wave after in-session caret continuity (ADR 0010). This is **not** caret continuity reopen, **not** semantic transaction reopen (ADR 0009 already landed), and **not** a FindBar skin redesign.

## Solution

Lock **ADR 0011** document-semantic find/replace for the existing Reading Surface (ADR 0004). Lead invariants:

> **Find/Replace over the canonical authored document stream—not separate DOM + CodeMirror counts. Matches share one source-range identity. Replace Current / Replace All commit through ADR 0009 transactions and restore position via ADR 0010. Mounting a block to show a match must not change the result set.**

Define searchable scope over the authored Markdown/document map: what is searchable, what is presentation-only (chrome, hidden, aria-hidden stay out by policy—not ad-hoc skip lists alone), how matches cross inline markup (emphasis/link boundaries must not drop a hit), and how source ranges map back to a rendered position. Navigation may mount a block to reveal a hit; mounting must not alter the result set or invent a second count. Replace Current and Replace All go through the ADR 0009 transaction boundary (one intent → one undo unit) and restore caret/selection via ADR 0010 document position.

**No new Find skin as a product goal** — reuse existing FindBar chrome. Presentation polish is theme-affine match highlight and an honest match count only.

First acceptance surface: custom editor only — `office-view-markdown.markdownViewer`.

## User Stories

1. As an author, I Find a string that appears in prose, across an emphasis/link boundary, and inside a code/math block, and the match count is one honest document-wide total—not DOM count + separate CM count.
2. As an author, I Find Next / Find Previous through mixed surfaces; the editor may mount a block to show the hit, but the result set and count do not change because of mounting.
3. As an author, I Replace Current (or Replace All) and get one predictable undo unit per command via ADR 0009; caret/selection returns via ADR 0010 document position—not a collapsed or surface-local restore.
4. As an author, presentation chrome, hidden, and aria-hidden nodes are never in the searchable stream; I do not get phantom hits from UI chrome.
5. As an author, FindBar chrome looks like the existing editor chrome (no new skin); match highlight is theme-affine and the count matches what navigation will visit.

## Implementation Decisions

- Obey ADR 0004 (stay inside native WYSIWYG Reading Surface) and locked **ADR 0011** at `docs/adr/0011-document-semantic-find.md` (architect `277b189`).
- Consume **ADR 0009** for Replace Current / Replace All (one intent → one undo unit; no render-only history).
- Consume **ADR 0010** document position for navigate-to-match and post-replace caret/selection restore.
- Prefer a document-level search index with shared **source ranges** over dual DOM walk + CM scan that disagree on count.
- Crossing emphasis/link (and sibling inline) boundaries must not drop a hit; inline authored code/math source is in scope when it is part of the authored stream.
- Presentation-only nodes (chrome, hidden, aria-hidden) stay out of the searchable stream by policy.
- Mounting a block to show a match is presentation; it must not change the result set.
- **Reuse existing FindBar chrome** — no FindBar skin redesign / second Find UI as a product goal.
- Acceptance only on `office-view-markdown.markdownViewer`. Stock Markdown preview/editor does not count.
- No Welcome, second preview, LLM, caret-continuity reopen, semantic-tx reopen, open-doc rework, full link-grammar wave, or async-render generation as a standalone ship.

## Acceptance Criteria

### ui 观感约束（与 ADR 0011 一一对应，Studio 锁定）

1. **高亮同族**：命中高亮与现有选区/主题同族（theme-affine），勿 prose 系统蓝 + CM 另一色。
2. **计数诚实**：Find 计数 = 权威文档流命中数；挂载块展示命中不得改计数。
3. **跳转一次落稳**：Find Next / 点选命中 → 视口与选区一次落到源范围（经 ADR 0010 文档位），勿先跳块顶再归位。

反例（一律拒）：DOM+CM 两套计数、为 Find 单开新皮肤、Replace 绕开 ADR 0009 事务。验收只认 `office-view-markdown.markdownViewer`。

### 功能验收

Lead with ADR 0011 invariant (custom editor only):

1. **Canonical authored stream** — Find indexes the authored document stream (shared source ranges for prose, inline markup, embedded code/math); not separate disagreeing DOM + CM counts.
2. **Cross-inline hits** — A match spanning emphasis/link (or sibling inline) boundaries is one hit; presentation skip is policy, not the sole semantic gate.
3. **Stable result set under mount** — Navigate-to-match may mount a block; mounting does not add/remove/reorder hits or change the count.
4. **Replace via ADR 0009 + ADR 0010** — Replace Current / Replace All: one intent → one undo unit; post-replace position restore via document position.
5. **First slice** — On `markdownViewer`: Find / Find Next across prose + inline markup + at least one embedded code/math block; Replace Current once; Replace All on a small fixture; confirm count, undo, and position.
6. Build + existing unit suite green; targeted search-index / replace-tx tests where pure seams allow.

## Testing Decisions

- Unit: search index over authored stream — prose, cross-inline markup, embedded code/math source ranges; presentation chrome/hidden/aria-hidden excluded by policy.
- Unit: result set identity stable across lazy CM mount/teardown used only to reveal a hit.
- Unit where feasible: Replace Current / Replace All go through transaction API (one undo unit); position restore uses ADR 0010 identity.
- Manual / host smoke on `markdownViewer`: Find count honesty across mixed surfaces; Find Next mount-without-count-change; Replace Current undo; Replace All undo; Light/Dark(/HC) optional for match-highlight 观感.
- Do not require full VS Code screenshot CI for this lock; agents should leave a short SMOKE note when implementing.
- No FindBar skin redesign tests; chrome reuse only.

## Out of Scope

- In-session caret continuity reopen (ADR 0010 / `.scratch/caret-continuity` — done; this wave **consumes** position)
- Semantic editing transactions reopen (ADR 0009 / `.scratch/semantic-edit-tx` — done; this wave **consumes** tx boundary)
- Open-document stability (ADR 0008 / `.scratch/open-doc-stable` — done)
- Failure honesty / AES (done)
- Welcome page, automatic side preview, second preview surface, source-mode replacement
- LLM / API-key features
- **FindBar skin redesign / new Find chrome** (explicit non-goal; reuse existing chrome)
- Full link/wiki/HTML target-grammar unification as a standalone wave (pain #4)
- Async render generation / source-revision guards as a standalone ship (pain #5)
- Reopening paste/table (ADR 0007) or changing PlantUML/privacy ADRs 0001–0003

## Further Notes

- Studio 2026-09-14: caret-continuity closed against ADR 0010; **this wave locked** against ADR 0011 for forge.
- Studio queue: failure honesty (DONE) → open-doc stable (DONE) → semantic edit transactions (DONE) → in-session caret continuity (DONE) → **document-semantic find/replace** (this wave).
- Architect `ovm-next-ux-pain.md` item **3** drives this wave; items 4–5 remain out-of-scope except as related-later notes.
- ADR 0011 acceptance on `markdownViewer` only; ui 观感 provisional (theme-affine highlight + honest count) until Studio notes arrive.
- Source anchors (pain #3): `vditor/src/ts/ui/FindBar.ts`; `vditor/src/ts/markdown/getMarkdown.ts`.
