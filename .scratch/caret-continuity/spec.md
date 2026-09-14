# Spec: 「会话内光标/键盘连续性」 / In-session caret & keyboard continuity

Status: ready-for-agent

## Problem Statement

While a document stays open in `office-view-markdown.markdownViewer`, plain WYSIWYG prose, task/list structures, HTML islands, math/diagram blocks, and CodeMirror blocks do not share one position representation. The implementation moves between DOM `Range` paths/text offsets, `wbr`/zero-width-space markers, and CodeMirror block indexes/offsets. Off-screen code blocks become placeholders and remount; special blocks switch preview↔edit. At a boundary, Arrow/Home/End/Enter/Backspace or mouse enter/leave can require a second action, lose the expected selection side, collapse the caret to a nearby block after remount, stack a surface-selection ring with an inner CM ring, or jump the viewport to block top then rehome. This is **not** open-document restore (ADR 0008) and **not** semantic transaction reopen (ADR 0009)—it is the active editing/navigation contract while the document is already open. Architect pain #2 (P1) and locked **ADR 0010** name this as the next polish wave after semantic edit transactions.

## Solution

Lock **ADR 0010** in-session caret and keyboard continuity for the existing Reading Surface (ADR 0004). Lead invariant:

> **One logical document position across remounts; one continuous keyboard/mouse boundary contract; one focus token and one highlight family across surfaces.**

Define a stable document position for every editable block and inline object, then map it to DOM or CodeMirror only at the interaction edge. A render, mount, teardown, or preview transition must preserve logical caret/selection and direction. Crossing an object has deterministic keyboard and mouse behavior; the viewport follows the selection in one motion. Visual contract (Studio / ui): one focus token when crossing surfaces; no “surface selected + inner CM ring” stack; cross-surface highlight stays one family.

First acceptance surface: custom editor only — `office-view-markdown.markdownViewer`. FindBar **consumes** this position contract later; this wave does not ship a FindBar rewrite or new skin.

## User Stories

1. As an author, I Arrow / Home / End across a prose↔code (or task/list / special-block) boundary and the caret moves deterministically with the viewport following once—not jump-to-block-top then rehome.
2. As an author, I Enter / Backspace at an embedded-block boundary and keep the expected side of the selection; I do not need a second action or a double-click on the block edge to enter edit.
3. As an author, after Lute re-render, lazy CodeMirror mount/teardown, or preview↔edit toggle, my logical caret/selection (and direction) is restored—not collapsed to block top with a second invented focus ring.
4. As an author, entering/leaving a code block shows **one** focus token; drag or Shift+Arrow across surfaces uses the **same** highlight family (not system-blue vs theme-color).
5. As an author, Tab never traps into chrome; FindBar behavior is unchanged in this wave (it will consume the position contract later).

## Implementation Decisions

- Obey ADR 0004 (stay inside native WYSIWYG Reading Surface) and locked **ADR 0010** at `docs/adr/0010-in-session-caret-continuity.md` (architect `d82432f`).
- Prefer a stable document-position model over more browser-specific marker repairs: logical identity first; DOM/CM mapping only at the interaction edge.
- Remounts, lazy CM mount/teardown, and preview↔edit are presentation transitions that **must** preserve logical caret/selection—they must not invent a second focus or collapse to block top.
- First slice surfaces: prose (DOM) ↔ CodeMirror code blocks, with task/list structure and sibling special blocks on the same boundary contract when caret/keyboard reaches them.
- Acceptance only on `office-view-markdown.markdownViewer`. Stock Markdown preview/editor does not count.
- FindBar: document as future **consumer** of the position contract; do **not** ship FindBar rewrite or new skin in this wave.
- No Welcome, second preview, LLM, open-doc rework, semantic-tx reopen, or failure-honesty rework.
- Anti (Studio locked): double-click block edge to enter edit; Tab trap into chrome; stacked surface + CM inner rings; system-blue vs theme-color cross-surface highlight split.

## Acceptance Criteria

### ui 观感约束（与 ADR 0010 一一对应，Studio 锁定）

Visual is **not** a new skin. Caret, keyboard, and selection across surfaces should feel like **one editor**:

1. **焦点环**：进/出 code（及兄弟嵌入面）仅一套 focus token；拒「表面选中 + CM 内环」叠环。
2. **视口跟随**：Arrow/Home/End 跨界时视口一次跟随选区；拒「先跳块顶再归位」。
3. **选区高亮**：跨面拖选 / Shift+Arrow 同族高亮；拒系统蓝 vs 主题色分裂。

反例（一律拒）：双击块边进入编辑；Tab 困进 chrome；为连续性另开第二预览面 / Welcome / FindBar 换皮。验收只认 `office-view-markdown.markdownViewer`。首验切片按 ADR 0010。

### 功能验收

Lead with ADR 0010 invariant (custom editor only):

1. **Stable document position** — Logical caret/selection identity survives Lute re-render, lazy CM mount/teardown, and preview↔edit; remounts do not collapse caret to block top.
2. **Boundary keyboard / mouse** — Arrow/Home/End/Enter/Backspace and mouse enter/leave across prose↔CM (and task/list / special-block) have deterministic behavior; viewport follows selection once; no double-click edge required to enter edit; Tab does not trap into chrome.
3. **One focus token + one highlight family** — Entering/leaving embedded surfaces shows one focus; cross-surface drag/Shift+Arrow highlight stays one family.
4. **First slice** — On `markdownViewer`: navigate and select across prose ↔ code (with task/list or special-block when in path) under remount/lazy-mount pressure; confirm position, viewport, focus, and highlight contract.
5. Build + existing unit suite green; targeted position / boundary tests where pure seams allow.

## Testing Decisions

- Unit: document-position round-trip across remount / lazy CM mount-teardown / preview↔edit; caret does not collapse to block top.
- Unit where feasible: boundary Arrow/Home/End mapping; selection direction preserved across surface cross.
- Manual / host smoke on `markdownViewer`: prose↔CM Arrow/Home/End; Enter/Backspace at boundary; mouse enter/leave without double-click edge; remount under caret; Light/Dark(/HC) optional for focus-ring / highlight 观感.
- Do not require full VS Code screenshot CI for this lock; agents should leave a short SMOKE note when implementing.
- FindBar: no rewrite tests in this wave—only that position APIs remain consumable (document in notes if touched).

## Out of Scope

- Semantic editing transactions (ADR 0009 / `.scratch/semantic-edit-tx` — done)
- Open-document stability (ADR 0008 / `.scratch/open-doc-stable` — done)
- Failure honesty / AES (done)
- Welcome page, automatic side preview, second preview surface, source-mode replacement
- LLM / API-key features
- Find/replace rewrite (FindBar later **consumes** this position contract; not shipped here; no new skin)
- Async render generation / source-revision guards as a standalone ship (pain #5)
- Link/wiki/HTML target-grammar unification as a standalone wave (pain #4)
- Reopening paste/table (ADR 0007) or changing PlantUML/privacy ADRs 0001–0003
- Reopening ADR 0009 coordinator / undo-stack work except where post-commit position restore already depends on this contract

## Further Notes

- Studio 2026-09-14: semantic-edit-tx closed against ADR 0009; **this wave locked** against ADR 0010 for forge.
- Studio queue: failure honesty (DONE) → open-doc stable (DONE) → semantic edit transactions (DONE) → **in-session caret continuity** (this wave).
- Architect `ovm-next-ux-pain.md` item **2** drives this wave; items 3–5 are out-of-scope except as consumer notes (FindBar) or related-later.
- ADR 0010 acceptance starts with prose↔CM boundary continuity on `markdownViewer` only; ui 观感 locked with Studio (one focus, one viewport follow, one highlight family).
