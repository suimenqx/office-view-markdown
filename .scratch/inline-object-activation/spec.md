# Spec: 「内联对象激活」 / Inline-object activation

Status: ready-for-agent

## Problem Statement

Ordinary links, link references, wiki links, images, and raw HTML islands in `office-view-markdown.markdownViewer` each have distinct resolution, click, edit, and focus-return paths. The WYSIWYG link popover mutates rendered nodes on input; `linkClick` resolves several target types and applies modifier/double-click policy; the host provider separately opens `wiki:` links; raw HTML is read-only in the surface and enters a single CodeMirror popover on click or Alt+Enter, where saving can replace the entire rendered node.

Users expect one mental model: activate → navigate or edit → save → return focus to the logical source. Today a click can mean navigation, selection, opening an edit popover, opening an image, or no action depending on target type, mode, modifier, and whether the host callback is installed. Wiki and raw HTML are especially opaque: visible content and source destination differ, and a successful edit needs to return focus to the logical source position—not whichever replacement DOM node survived. Architect pain #4 (P1) and locked **ADR 0012** name this as the next polish wave after document-semantic find (ADR 0011). This is **not** FindBar reopen, **not** caret/tx reopen (ADR 0009/0010 already landed and are consumed), and **not** async image/diagram generation guards (pain #5 backlog).

## Solution

Lock **ADR 0012** inline-object activation for the existing Reading Surface (ADR 0004). Lead invariants:

> **Link / wiki / image / HTML share one activation + edit contract. Every link-like object exposes a stable source target (display vs destination), deterministic activation and edit affordances, and a focus anchor that survives save/remove/re-render via ADR 0010. Edits commit through ADR 0009 (one intent → one undo/dirty). Host opens (e.g. `wiki:`) use the same target object—not a parallel click grammar. Raw HTML may stay a source popover, but save is one semantic transaction that preserves enclosing document position.**

Define a shared **document-target** object carrying target kind, display/source ranges, activation action, editable fields, host-open action, and focus anchor. Wiki path/fragment resolution and link-reference edits use that contract without a second preview surface. Raw HTML can remain an explicit source popover, but its save must be one ADR 0009 transaction and restore via ADR 0010.

**ui 观感 provisional** — click / modifier / double-click / Alt+Enter / refocus grammar awaits Studio notes. Product suggestion until then: theme-affine affordances (hover/focus ring in-family with existing chrome), deterministic activation (same gesture → same action per target kind), and focus return after save (one settle to the focus anchor, not a jump-then-rehomed caret).

First acceptance surface: custom editor only — `office-view-markdown.markdownViewer`.

## User Stories

1. As an author, I activate an ordinary link, wiki link, image, or HTML island and get a deterministic outcome (navigate / open host / edit) that does not depend on an ad-hoc per-type click grammar.
2. As an author, I edit a link-like target (href, wiki path/fragment, image src/alt, or HTML source) and get one ADR 0009 undo/dirty unit; surrounding document position is preserved.
3. As an author, after save or cancel I return to the logical source focus anchor via ADR 0010—not to an arbitrary replacement DOM node.
4. As an author, wiki host-open (`wiki:`) and link-reference edits use the same document-target contract as ordinary links—no parallel provider-only click path as the product mental model.
5. As an author, raw HTML stays a source popover if needed, but save is one semantic transaction under the same contract; I do not lose enclosure identity or selection.

## Implementation Decisions

- Obey ADR 0004 (stay inside native WYSIWYG Reading Surface) and locked **ADR 0012** at `docs/adr/0012-inline-object-activation.md` (architect `4dfe340`).
- Consume **ADR 0009** for every inline-object save/edit (one intent → one undo unit; no render-only history from popover/DOM rewrite).
- Consume **ADR 0010** document position for focus anchor across activate / edit / save / remove / re-render.
- Prefer one shared **document-target** model (kind, display vs destination, activation, editable fields, host-open, focus anchor) over distributed policy in toolbar / `linkClick` / provider wiki / HTML editor.
- Wiki path/fragment and link-reference edits land on the same contract; host opens use the target object, not a second grammar.
- Raw HTML may remain source-popover UX; save must be one ADR 0009 transaction preserving enclosing document position (ADR 0010).
- **ui 观感 provisional** until Studio notes — suggest theme-affine affordances, deterministic activation, focus return after save; do not invent a new chrome skin as a product goal.
- Acceptance only on `office-view-markdown.markdownViewer`. Stock Markdown preview/editor does not count.
- No Welcome, second preview, LLM, FindBar reopen, caret/tx reopen, open-doc rework, or async-render generation guards as a standalone ship (pain #5 backlog).

## Acceptance Criteria

### ui 观感约束（与 ADR 0012 一一对应，Studio 锁定）

1. **点击语法统一**：link / wiki / image / HTML 单击进编辑或打开同一套手势；勿一类单击跳、一类必须双击。
2. **修饰键可见**：Cmd/Ctrl+Click 打开时不先闪编辑环；普通单击才出编辑 affordance。
3. **回焦一次**：关闭 popover / 保存后焦点锚一次落回对象，勿跳到段首或块顶。

反例（一律拒）：wiki 另套手势、图点一下全选正文、HTML 保存后选区消失。异步图世代守卫本波不进。验收只认 `office-view-markdown.markdownViewer`。

### 功能验收

Lead with ADR 0012 invariant (custom editor only):

1. **Shared document-target** — Ordinary link, link-reference, wiki link, image, and HTML island expose one target object (kind, display vs destination, activation, editable fields, host-open, focus anchor).
2. **Deterministic activation + edit** — Activate and edit paths are explicit per kind under one contract; wiki host-open uses the same target object.
3. **Save via ADR 0009** — Popover / inline edit save: one intent → one undo/dirty; no render-only history from node replace.
4. **Focus via ADR 0010** — Focus anchor survives save / remove / re-render; post-save return is document position, not surviving DOM identity alone.
5. **First slice** — On `markdownViewer`: activate+edit ordinary link; wiki open/edit under same contract; HTML source popover save as one tx with position restore; image activation/edit fields under same target model where already in surface.
6. Build + existing unit suite green; targeted target-contract / activation / save-tx tests where pure seams allow.

## Testing Decisions

- Unit: document-target model — kind, display vs destination ranges, focus-anchor identity across re-render/replace.
- Unit: activation policy table (even if provisional gestures) maps kind → action without divergent provider-only paths as the sole truth.
- Unit where feasible: link/wiki/HTML/image save goes through ADR 0009 transaction API (one undo unit); position restore uses ADR 0010 identity.
- Manual / host smoke on `markdownViewer`: ordinary link edit+undo+focus return; wiki host-open + edit under same contract; HTML popover save+undo+enclosing position; image activate/edit where applicable; Light/Dark(/HC) optional for affordance 观感.
- Do not require full VS Code screenshot CI for this lock; agents should leave a short SMOKE note when implementing.
- No FindBar / Welcome / second-preview / LLM / async-generation-guard tests as part of this wave.

## Out of Scope

- FindBar / document-semantic find reopen (ADR 0011 / `.scratch/semantic-find` — done or consuming; this wave does **not** reopen Find)
- In-session caret continuity reopen (ADR 0010 / `.scratch/caret-continuity` — done; this wave **consumes** position)
- Semantic editing transactions reopen (ADR 0009 / `.scratch/semantic-edit-tx` — done; this wave **consumes** tx boundary)
- Open-document stability (ADR 0008 / `.scratch/open-doc-stable` — done)
- Failure honesty / AES (done)
- Welcome page, automatic side preview, second preview surface, source-mode replacement
- LLM / API-key features
- **Async image/diagram generation / source-revision guards** as a standalone ship (pain #5 backlog)
- Full arbitrary-DOM HTML authoring / new Markdown semantics merely to ease one interaction
- Reopening paste/table (ADR 0007) or changing PlantUML/privacy ADRs 0001–0003

## Further Notes

- Studio 2026-09-14: semantic-find locked against ADR 0011; **this wave locked** against ADR 0012 for forge.
- Studio queue: … → document-semantic find/replace (DONE lock) → **inline-object activation** (this wave).
- Architect `ovm-next-ux-pain.md` item **4** drives this wave; item **5** (async render guards) remains backlog.
- ADR 0012 acceptance on `markdownViewer` only; ui 观感 provisional (theme-affine affordances + deterministic activation + focus return) until Studio notes arrive.
- Source anchors (pain #4): `vditor/src/ts/util/linkClick.ts`; `vditor/src/ts/wysiwyg/highlightToolbarWYSIWYG.ts`; `vditor/src/ts/htmlInline/htmlInlineEditor.ts`; `src/provider/markdownEditorProvider.ts`; `src/service/markdown/wikilink/open.ts` and `resolve.ts`.
