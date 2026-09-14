# Spec: 「异步渲染世代」 / Async-render generation

Status: ready-for-agent

## Problem Statement

PlantUML, Mermaid, and image loads in `office-view-markdown.markdownViewer` are still DOM- and closure-driven. Mermaid captures an element list and source, awaits rendering, then writes SVG; Retry closes over the captured code. PlantUML captures elements before script loading and later writes image markup; image Retry reuses the current DOM `src`. Theme refresh clears processed markers and re-renders a previously captured list.

If the author edits, undoes, deletes, replaces, or changes mode/theme while a script or image request is pending, an older result can arrive after the block has changed. The visible diagram/image can then lag behind source, attach chrome/error state to the wrong generation, or leave duplicate lifecycle artifacts—appearing to show the authored result while the saved Markdown says something else. Architect pain #5 (P1) and locked **ADR 0013** name this as the next polish wave after inline-object activation (ADR 0012). This is **not** FindBar/inline-object reopen, **not** caret/tx reopen (ADR 0009/0010 already landed and are consumed as non-inventors of history/focus), and **not** an AES redesign (ADR 0003 stays closed).

## Solution

Lock **ADR 0013** async diagram and image render generation guards for the existing Reading Surface (ADR 0004). Lead invariants:

> **PlantUML / Mermaid / image async results commit to the Reading Surface only when `(stable block identity, source revision, renderer/theme config)` is still current and the host element is connected. Stale results after edit, undo, delete, replace, or theme refresh must not write SVG/img/error chrome. Retry re-reads current source rather than a closed-over snapshot. Loading / ready / error states are mutually exclusive and disposable; they must not invent undo history (ADR 0009) and must not steal focus anchors (ADR 0010). Keep ADRs 0001–0003: AES contract unchanged—no default public PlantUML server, no silent probing; failures stay Actionable Empty State.**

Model each rendered block as the tuple `(stable block identity, source revision, renderer configuration/theme)`. An async result may commit only when that tuple is still current and the element is connected. Retry must reread current source at click time. Loading / ready / error are a disposable state machine—not presentation markers alone (`data-processed` / error hosts without ownership).

**ui 观感 provisional** — loading → ready / error transitions without flash of stale diagram; no flicker between generations. Product suggestion until Studio notes: dispose prior generation chrome before committing the next; never briefly show the previous SVG/img when the source or theme has already moved on; AES chrome (ADR 0003) remains the failure presentation—no new empty-state family.

First acceptance surface: custom editor only — `office-view-markdown.markdownViewer`.

## User Stories

1. As an author, I edit or undo a PlantUML/Mermaid/image block while a prior render is in flight, and the stale SVG/img/error never overwrites the current block.
2. As an author, I change theme (or renderer config) while a render is pending, and only a result matching the current theme/config commits—no cross-theme flash.
3. As an author, I click Retry on an AES failure and the retry uses the **current** source (and current config), not a closure captured at first failure.
4. As an author, loading / ready / error for a block are mutually exclusive; I never see duplicate lifecycle chrome or a flash of the previous generation.
5. As an author, async render commit / dispose / Retry never add undo/dirty history (ADR 0009) and never steal or relocate my focus anchor (ADR 0010). AES Open Settings / Retry affordances and copy stay as ADR 0003.

## Implementation Decisions

- Obey ADR 0004 (stay inside native WYSIWYG Reading Surface) and locked **ADR 0013** at `docs/adr/0013-async-render-generation.md` (architect `4ad17be`).
- Commit guard: async write of SVG / img / error chrome only when `(block identity, source revision, theme/config)` is still current **and** the host element is connected.
- Retry re-reads current source (and current renderer/theme config) at action time—no closed-over snapshot as the product path.
- Loading / ready / error are mutually exclusive and disposable; supersede prior generation before committing the next.
- **Do not invent undo history** — render commit, dispose, and Retry are presentation/lifecycle only (consume ADR 0009 as a non-writer of history).
- **Do not steal focus anchors** — render transitions must not move caret/selection (consume ADR 0010 as a non-thief of focus).
- **AES contract unchanged (ADR 0003)** — same AES family, Open Settings when unconfigured, Retry when configured render/image fails; no default public PlantUML server, no silent probing (ADRs 0001–0002 stay closed).
- **ui 观感 provisional** until Studio notes — no flash of stale diagram; no flicker between generations; do not invent a new empty-state skin.
- Acceptance only on `office-view-markdown.markdownViewer`. Stock Markdown preview/editor does not count.
- No Welcome, second preview, LLM, FindBar skin, inline-object reopen, caret/tx reopen, or open-doc rework.

## Acceptance Criteria

### ui 观感约束（与 ADR 0013 一一对应，Studio 锁定）

1. **无陈旧闪现**：源已改 / 主题已换时，勿先闪旧 SVG/img 再换新图。
2. **世代无闪烁**：loading → ready / error 互斥；代际切换一次落稳，勿双层 chrome 叠闪。
3. **Retry 跟当前源**：失败态 Retry 读当前源与当前 theme/config，勿闭包快照。

反例（一律拒）：过期异步写回、Retry 重放旧源、渲染进 undo、渲染抢焦点锚、改 AES/默认公网 PlantUML。验收只认 `office-view-markdown.markdownViewer`。

### 功能验收

Lead with ADR 0013 invariant (custom editor only):

1. **Generation guard** — Async PlantUML / Mermaid / image results commit only when `(stable block identity, source revision, renderer/theme config)` is still current and the host is connected.
2. **Stale discard** — After edit / undo / delete / replace / theme refresh, in-flight results for a superseded tuple do not write SVG/img/error chrome.
3. **Retry current source** — Retry re-reads current source (+ current config); not a closed-over snapshot from first failure.
4. **AES unchanged (ADR 0003)** — Failures stay Actionable Empty State; Open Settings / Retry affordances and copy unchanged; no default public server / silent probing.
5. **No undo / no focus steal** — Render commit / dispose / Retry do not invent ADR 0009 undo/dirty units and do not steal ADR 0010 focus anchors.
6. **First slice** — On `markdownViewer`: Mermaid + PlantUML + image paths under the same guard; theme-refresh discard; Retry-after-edit uses new source; build + suite green with targeted generation-guard tests where pure seams allow.

## Testing Decisions

- Unit: generation token / revision tuple — commit allowed only when identity + source revision + theme/config still match; connected-host check.
- Unit: stale discard after simulated edit / delete / theme change while a fake async is pending.
- Unit: Retry reads current source (not closed-over snapshot).
- Unit where feasible: render commit / dispose does not call ADR 0009 transaction/history APIs; focus/selection identity unchanged across commit (ADR 0010).
- Manual / host smoke on `markdownViewer`: edit-during-render no stale write; theme switch mid-flight; Retry after edit; AES still shows Open Settings / Retry; Light/Dark(/HC) optional for loading→ready 观感.
- Do not require full VS Code screenshot CI for this lock; agents should leave a short SMOKE note when implementing.
- No FindBar / Welcome / second-preview / LLM / AES-redesign / inline-object-reopen tests as part of this wave.

## Out of Scope

- Inline-object activation reopen (ADR 0012 / `.scratch/inline-object-activation` — done or consuming; this wave does **not** reopen activation grammar)
- Document-semantic find reopen (ADR 0011 / `.scratch/semantic-find` — done)
- In-session caret continuity reopen (ADR 0010 / `.scratch/caret-continuity` — done; this wave **must not steal** focus)
- Semantic editing transactions reopen (ADR 0009 / `.scratch/semantic-edit-tx` — done; this wave **must not invent** undo)
- Open-document stability (ADR 0008 / `.scratch/open-doc-stable` — done)
- Failure honesty / AES redesign (ADR 0003 — **unchanged**; consume presentation only)
- PlantUML privacy / render-shape reopen (ADRs 0001–0002)
- Welcome page, automatic side preview, second preview surface, source-mode replacement
- LLM / API-key features
- FindBar skin redesign
- New default/public PlantUML server, silent probing, auth flows, or new remote dependency surface

## Further Notes

- Studio 2026-09-14: inline-object-activation locked against ADR 0012; **this wave locked** against ADR 0013 for forge.
- Studio queue: … → inline-object activation (DONE lock) → **async-render generation** (this wave).
- Architect `ovm-next-ux-pain.md` item **5** drives this wave.
- ADR 0013 acceptance on `markdownViewer` only; ui 观感 provisional (no stale flash / no inter-generation flicker) until Studio notes arrive.
- Source anchors (pain #5): `vditor/src/ts/markdown/mermaidRender.ts`; `vditor/src/ts/markdown/plantumlRender.ts`; `vditor/src/ts/util/editorCommonEvent.ts`; `vditor/src/ts/codeBlock/codeMirrorManager.ts` (special-block preview paths).
