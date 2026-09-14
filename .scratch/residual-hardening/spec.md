# Spec: 「残差硬化」 / Residual hardening

Status: ready-for-agent

## Problem Statement

After ADR 0007–0013, the Reading Surface still has three product-visible residuals—not new features. (1) **Find** (ADR 0011): typing a query can steal focus into CodeMirror or mutate document body (xvfb was brittle; this may be harness-only or a real Light bug). (2) **Inline-object popover** (ADR 0012): contract + unit PASS, but the continuous GUI path plain-click → edit popover → save → refocus is missing on `markdownViewer`. (3) **Prose grouping** (ADR 0009): edits that still path through debounced `afterRender` can feel like multiple undo/dirty pulses instead of one intent. Architect **ADR 0014** (`73918d1`) and Studio Option 1 name these as the next polish wave. This is **not** a new surface, **not** Option 2 density polish, and **not** a greenfield reopen of 0007–0013.

## Solution

Lock **ADR 0014** residual hardening for the existing Reading Surface (ADR 0004). Lead invariants:

> **After ADR 0007–0013, the next slice hardens three product-visible residuals only—no new Reading Surface features: (1) Find input must not steal focus into CodeMirror or mutate document body while typing the query; (2) inline-object plain-click → edit popover → save → refocus must complete on `markdownViewer` under the ADR 0012 contract (not unit-only); (3) prose edits that still path through debounced `afterRender` must group as one ADR 0009 intent (one undo unit / one dirty pulse). Harness/Dark/HC debt stays secondary unless a Light bug is proven. Acceptance: existing SMOKE families extended, still `markdownViewer` only.**

Close the A-list top-3 with focused tickets + stronger smoke. Consume closed waves as contracts: 0011 (Find), 0012 (activation), 0009 (tx), 0010 (focus anchor). Extend with evidence; do not invent a second Find/popover/tx stack.

**ui 观感 — Studio Light must-fix (locked)** — three items, Light-blocking:

1. Find 输入不抢焦点、不污染正文。
2. popover 单击 → 编辑 → 保存 → 回焦在 GUI 一次完成。
3. 仍走 `afterRender` 的散文按一意图分组。

Harness Dark/HC is **not** blocking for this wave.

First acceptance surface: custom editor only — `office-view-markdown.markdownViewer`.

## User Stories

1. As an author, I type a Find query in the existing FindBar and every keystroke stays in the query field; the caret does not jump into CodeMirror and the document body does not receive those characters.
2. As an author, I plain-click a link-like object, edit in the popover, Save, and focus returns once to the object on `markdownViewer` (GUI-visible, not unit-only)—one ADR 0009 undo, one ADR 0010 restore.
3. As an author, I type a short prose burst that still goes through debounced `afterRender` and get one undo unit / one dirty pulse for that intent (Ctrl+Z undoes the burst once, not letter-by-letter or double-dirty).
4. As an author, I do not see a new Find skin, a second preview, or a reopened 0007–0013 greenfield rewrite.

## Implementation Decisions

- Obey ADR 0004 (stay inside native WYSIWYG Reading Surface) and locked **ADR 0014** at `docs/adr/0014-residual-hardening.md` (architect `73918d1`).
- **Extend, do not reopen:** ADR 0011 Find, ADR 0012 activation, ADR 0009 tx, ADR 0010 position, ADR 0013 generation stay closed contracts. This wave lands residual proofs + the minimum product fix when Light evidence shows a real gap.
- **01 Find focus while typing** — query input owns focus for the duration of typing; search/index/CM reveal-mount must not steal it; keystrokes must not commit into the authored body. Reuse existing FindBar chrome (no skin).
- **02 Popover save → refocus GUI** — prove ADR 0012 continuous path on `markdownViewer`: plain-click → popover → save → `restoreDocumentTargetFocus` once. Saves already go through `commitAuthoredEdit` (`linkHtml`); this ticket is GUI completeness, not a new activation grammar.
- **03 afterRender intent grouping** — prose that still debounce-records via `afterRenderEvent` / `recordHistory` must group as one ADR 0009 intent (one undo / one dirty). Do not invent a second coordinator.
- **ui 观感 locked (Light must-fix)** — the three items above; Dark/HC harness coverage is secondary (B-list) and does not block ship.
- Acceptance only on `office-view-markdown.markdownViewer`. Stock Markdown preview/editor does not count.
- Extend existing SMOKE families (semantic-find / inline-object-activation / semantic-edit-tx); do not invent a fourth product surface or Welcome/LLM/second preview.
- Forge sequence **01 → 02 → 03**; estimate **2.5–4.5d**. Tickets are product-independent residuals; order is Studio/forge priority, not a hard code DAG.

## Acceptance Criteria

### ui 观感约束（与 ADR 0014 一一对应，Studio 锁定）

Light 三件 must-fix（阻塞）：

1. **Find 不抢焦 / 不污染正文**：Find 输入框打字时焦点留在查询框；击键不得写入文档正文，也不得把焦点偷进 CodeMirror。
2. **Popover GUI 闭环**：plain-click → 编辑 popover → save → 回焦一次完成，在 `markdownViewer` Light 下连拍可证（非仅 unit）。
3. **afterRender 一意图**：仍走 debounce `afterRender` 的散文编辑合成一次 ADR 0009 意图（一次 undo / 一次 dirty 脉冲）。

反例（一律拒）：Find 打字把字母打进正文或焦点跳进代码块；保存 popover 后焦点落段首/块顶且 GUI 无法演示；连打几个字变成多次 undo 或双 dirty。Harness Dark/HC 缺口不构成本波失败。验收只认 `office-view-markdown.markdownViewer`。

### 功能验收

Lead with ADR 0014 invariant (custom editor only):

1. **Find typing isolation** — While FindBar is focused, query input does not steal into CM and does not mutate authored Markdown. Existing ADR 0011 index/count/replace contracts stay intact.
2. **Popover GUI path** — On `markdownViewer`, at least ordinary link (and wiki/HTML where already in SMOKE): plain-click → edit → save → focus returns once via ADR 0010; one ADR 0009 undo. Unit-only is not enough.
3. **Prose afterRender grouping** — A single prose intent that still records through debounced `afterRender` is one undo unit / one dirty pulse.
4. **No new surface** — No Welcome, second preview, LLM, FindBar skin, or new popover family.
5. **First slice** — Issues 01 → 02 → 03 on `markdownViewer`; existing SMOKE families extended; build + suite green with targeted tests where pure seams allow.
6. Dark/HC / B-list harness debt is secondary and non-blocking unless a Light bug is proven.

## Testing Decisions

- Unit where seams allow: Find input focus ownership across search/CM mount; popover save + `restoreDocumentTargetFocus`; afterRender debounce groups one intent / one dirty.
- Manual / host smoke on `markdownViewer` (Light blocking): type a Find query without body pollution or CM steal; link (and wiki/HTML if in fixture) click→save→refocus continuous shots; prose burst → one undo / one dirty.
- Extend existing SMOKE notes under `.scratch/semantic-find`, `.scratch/inline-object-activation`, `.scratch/semantic-edit-tx` (or a short wave SMOKE that points at those families). Do not require full VS Code screenshot CI for lock; agents leave a SMOKE note when implementing.
- Dark/HC, Enter/Backspace/Tab-leave-chrome frames, Replace Current/All GUI automation, Retry secondary-click harness, recurring xvfb popover/webview flakiness = **B-list**, owned later with forge/coco — not this wave’s gate.
- No Welcome / second-preview / LLM / Option 2 density / greenfield 0007–0013 tests.

## Out of Scope

- **No new Reading Surface** — no Welcome, automatic side preview, second preview, source-mode replacement, LLM / API-key, FindBar skin, new popover/chrome family.
- **Do not reopen ADR 0007–0013 as greenfield.** Paste/table (0007), open-doc (0008), semantic tx (0009), caret (0010), semantic-find (0011), inline-object (0012), async-render (0013) stay closed; this wave **extends** 0011/0012/0009 residuals with evidence only.
- **Option 2** Reading Surface density leftovers (frontmatter chips, code-block label/copy, task/image micro-chrome).
- **Option 3** soak-only (this lock is Option 1).
- **Harness B-list (secondary):** Dark/HC selection & find highlight; Enter/Backspace/Shift/Tab-leave-chrome weak frames; Replace Current/All GUI automation; Retry secondary-click false damage; recurring xvfb popover/webview focus flakiness — unless a Light product bug is proven.
- A-list leftovers **not** in this top-3: task/link GUI smoke never cleanly hit (0009 #2); theme-switch / mid-flight stale flash under live GUI (0013 #5) — do not expand unless they fall out of 02/03 with evidence.
- PlantUML privacy / AES redesign (ADRs 0001–0003 stay closed).
- `_scratch` env hygiene (coco).

## Further Notes

- Studio 2026-09-15: backlog Option 1 **locked** against ADR 0014 for forge. ui Light must-fix = the three items above. Harness Dark/HC not blocking.
- Forge: implement **01 → 02 → 03**; estimate **2.5–4.5d**.
- Studio queue: async-render generation (DONE lock, ADR 0013 `f01473a`) → **residual hardening** (this wave).
- Architect ADR 0014 (`73918d1`) + `.scratch/studio-backlog/BACKLOG.md` Option 1 / A-list #3, #4, #1 drive this wave.
- Source anchors: `vditor/src/ts/ui/FindBar.ts` (`scheduleRestoreFindFocus`, input/search); `vditor/src/ts/wysiwyg/highlightToolbarWYSIWYG.ts` (`commitAuthoredEdit` + `restoreDocumentTargetFocus`); `vditor/src/ts/htmlInline/htmlInlineEditor.ts`; `vditor/src/ts/wysiwyg/afterRenderEvent.ts`; `vditor/src/ts/wysiwyg/input.ts`.
