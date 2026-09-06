# Spec: 「语义编辑事务」 / Semantic editing transactions

Status: ready-for-agent

## Problem Statement

A visible Markdown document is edited through more than one history: the outer Vditor stack and CodeMirror’s per-block history (plus task/list toggles, link/HTML popovers, special-block chrome). Ctrl+Z ownership follows focus; CodeMirror edits sync into the outer stack on a delay and again on blur; outer undo replaces HTML and remounts blocks. The same user intent can therefore yield surprising grouping, an extra undo step, a no-op, or a dirty/save pulse that does not match what the author just did. Trust in undo and save breaks before any new feature matters. Architect pain #1 (P0) and locked **ADR 0009** name this as the next mainline after open-doc stability.

## Solution

Lock **ADR 0009** semantic editing transactions for the existing Reading Surface (ADR 0004). Lead invariant:

> **One user intent → one Markdown commit / one undo unit / one dirty.**

Presentation-only work—render remounts, lazy CodeMirror mount/teardown, diagram/image refresh, outline chrome—must **never** enter history or pulse a second dirty. **Focus must not decide which history owns Ctrl+Z.** Introduce (or harden toward) a transaction coordinator / canonical mutation commit shared by DOM prose, nested CodeMirror, task/list ops, and link/HTML (and special-block) edits. Undo/redo must round-trip the same Markdown and restore a stable document position after the commit.

First acceptance slice (custom editor only): **prose → code → task → link/HTML → undo/redo → save** on `office-view-markdown.markdownViewer`. FindBar and async render generation are **consumers** of this contract; this wave does not separately ship their rewrites.

## User Stories

1. As an author, I edit prose then a code block then toggle a task then edit a link/HTML node, and each intent is one undoable Markdown change with one dirty notification—not a focus-dependent stack or delayed double-commit.
2. As an author, I press Ctrl+Z / Ctrl+Y (or redo) after a mixed-surface sequence and get one predictable step per prior intent, with caret/selection returning to a stable document position—not “nothing happened” or a remount that eats my place.
3. As an author, I save after that sequence and the on-disk Markdown matches the visible document; dirty clears once, with no phantom dirty from a render-only remount.
4. As an author inside an embedded CodeMirror block, Ctrl+Z undoes my last **document** intent under the same stack policy as prose—focus alone does not hand ownership to a private CM history that diverges from Markdown.
5. As an author, watching the editor remount a code block, refresh a diagram, or update outline chrome never adds undo steps or dirty pulses.

## Implementation Decisions

- Obey ADR 0004 (stay inside native WYSIWYG Reading Surface) and locked **ADR 0009** at `docs/adr/0009-semantic-editing-transactions.md` (architect `c6add2c`).
- Prefer a coordinator / commit boundary over “smarter focus routing”: one canonical Markdown mutation path owns history, dirty/save, and post-commit position restore.
- Render remounts, lazy CM mount/teardown, preview/diagram refresh, and chrome updates are presentation-only—out of the undo stack and dirty channel unless they accompany a real authored mutation.
- First slice surfaces: prose (DOM), CodeMirror code blocks, task/list toggles, link/HTML popover edits. Special-block chrome that already mutates source should go through the same commit path when touched; do not invent a second surface.
- Acceptance only on `office-view-markdown.markdownViewer`. Stock Markdown preview/editor does not count.
- FindBar / async render generation: document as future consumers of the transaction (+ position/revision) contract; do **not** ship FindBar rewrite or render-generation state machine in this wave.
- No Welcome, second preview, LLM, open-doc rework, or failure-honesty rework.

## Acceptance Criteria

### ui 观感约束（Studio）

Visual is **not** a new skin. Undo, dirty, and selection should feel like **one edit** across prose and embedded blocks:

1. Entering/leaving a CodeMirror / task / link-HTML surface must **not** show a second competing focus ring or “mode switch” chrome that implies a second editor.
2. After undo/redo, caret/selection lands once at a stable place—no flash of wrong block then jump, no outline-active flicker from remount.
3. Dirty indicator and save behave as one document; remount-only work must not flicker dirty.

反例（一律拒）：双撤销栈靠焦点切换、渲染刷新进历史、为事务另开第二预览面、骨架/Welcome。验收只认 `office-view-markdown.markdownViewer`。

### 功能验收

Lead with ADR 0009 invariant (custom editor only):

1. **One intent → one commit / one undo / one dirty** — Each authored mutation (prose, CM code, task toggle, link/HTML edit) produces exactly one canonical Markdown commit, one undo unit, and one dirty/save notification.
2. **No render history** — Remount, lazy CM mount/teardown, diagram/image refresh, outline chrome never create history entries or a second dirty pulse.
3. **Focus ≠ history owner** — Ctrl+Z / redo ownership is not decided by which surface is focused; mixed-surface undo order matches intent order.
4. **First slice** — Sequence: edit prose → edit code block → toggle task → edit link or HTML → undo through the sequence → redo as applicable → save. Expected Markdown and dirty/clear match; stable document position restored after commits/undo.
5. Build + existing unit suite green; targeted coordinator / history tests where pure seams allow.

## Testing Decisions

- Unit: transaction boundary commits one Markdown snapshot per intent; presentation-only paths do not push history; dirty pulses once per commit.
- Unit where feasible: mixed-surface undo/redo round-trip Markdown; focus inside CM does not fork a divergent private stack for document-level Ctrl+Z.
- Manual / host smoke on `markdownViewer`: prose → code → task → link/HTML → undo/redo → save; confirm no remount-only dirty; Light/Dark(/HC) smoke optional for focus-ring 观感.
- Do not require full VS Code screenshot CI for this lock; agents should leave a short SMOKE note when implementing.

## Out of Scope

- Open-document stability (ADR 0008 / `.scratch/open-doc-stable` — done)
- Failure honesty / AES (done)
- Welcome page, automatic side preview, second preview surface, source-mode replacement
- LLM / API-key features
- Find/replace rewrite (FindBar later **consumes** this contract; not shipped here)
- Async render generation / source-revision guards as a standalone ship (pain #5 consumer note only)
- In-session caret continuity across DOM/CM boundaries as a **standalone** wave (pain #2; related later—this wave only requires stable position restore **after** a transaction commit/undo, not a full keyboard-boundary ADR)
- Reopening paste/table (ADR 0007) or changing PlantUML/privacy ADRs 0001–0003

## Further Notes

- Studio 2026-09-06: open-doc stable closed against ADR 0008; **this wave locked** against ADR 0009 for forge.
- Studio queue: failure honesty (DONE) → open-doc stable (DONE) → **semantic edit transactions** (this wave).
- Architect `ovm-next-ux-pain.md` item **1 only** drives this wave; items 2–5 are out-of-scope except as consumer notes (FindBar, async render) or related-later (in-session caret continuity).
- ADR 0009 acceptance starts with mixed-surface sequences on `markdownViewer` only.
