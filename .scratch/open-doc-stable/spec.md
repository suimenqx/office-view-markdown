# Spec: 「打开即稳」 / Open-document visual stability

Status: ready-for-agent

## Problem Statement

Opening a Markdown file in the custom editor often shows a brief wrong first paint: stock Vditor chrome, wrong theme or font size, then a jump to the real Reading Surface—and afterward a second jump as scroll/caret restore lands. Reopening the same document or opening a long note makes the flicker and scroll settle worse. Trust breaks before the user reads a word; ADR 0007 already names this as wave 2 after paste/table.

## Solution

Lock **ADR 0008** open-document stability for the existing Reading Surface (ADR 0004). The wave is defined by three invariants:

1. **首屏不闪** — first paint must not flash a half-finished / stock layout
2. **字号一次到位** — first frame uses Editor Font Size; no default→override jump
3. **滚位/光标可恢复** — apply `cacheFocus`-family scroll/caret anchors only after content is ready

Scroll always restores; caret/selection restore when `office-view-markdown.restoreViewState` is on. Prefer fixing boot/order and restore timing over new UI. Acceptance only on `office-view-markdown.markdownViewer`. Failure honesty (closed) and semantic edit transactions stay out of this wave.

## User Stories

1. As an author, I open an MD with the custom editor and never see a flash of wrong theme, wrong type size, or stock/empty layout before the real Reading Surface.
2. As an author with `restoreViewState` on, I reopen a doc and land at the same scroll position with caret/selection restored (prose or CodeMirror block when that was focused).
3. As an author with `restoreViewState` off, I still get scroll restored, but the editor does not steal caret/focus from my prior intent.
4. As an author, I close and reopen the same document in-session and get a stable, repeatable first paint + restore—no progressive “settle” flicker.
5. As an author of a long document, open + restore still lands near the remembered viewport without a visible top→target scroll dance or late layout jump that undoes restore.
6. As a navigator using outline / wiki fragment open, pending block scroll still wins over stale session scroll when that open path applies.

## Implementation Decisions

- Obey ADR 0004 (stay inside native WYSIWYG Reading Surface) and locked **ADR 0008** at `docs/adr/0008-open-document-stability.md` (architect `044e963`).
- Setting: `office-view-markdown.restoreViewState` (package default **true**; description: restore caret when opening; **scroll always restored**). Keep that product meaning; align host fallback in `markdownEditorProvider` (`config.get(..., false)` today) with contributed default so tests and first-run match Settings UI.
- Seams already present—prefer harden, don’t reinvent:
  - Host open payload: `documentCacheId`, `shouldRestoreFocus`, `pendingFragment`, `config` (theme/font) — `src/provider/markdownEditorProvider.ts`, `resource/markdown/index.js`
  - Scroll persistence: `vditor/src/ts/util/documentState.ts` (`*-scroll` keys)
  - Focus/caret: `vditor/src/ts/util/cacheFocus.ts` + `restoreDocumentSession(onLoad, restoreCaret)`
  - First UI: `initUI` theme/font apply; `after()` then `applyViewerSettings` + `restoreDocumentSession` — order/visibility here is the FOUC risk
- First paint (ADR 0008 #1–#2): resolve theme + `--editor-font-size` (+ viewer settings if enabled) **before** the document body is user-visible; hide or hold the webview shell until chrome matches (no stock layout flash). Do not load remote/bundled web fonts (ADR 0004).
- Restore timing (ADR 0008 #3): apply scroll (and caret when enabled) after layout that affects viewport (including lazy code-block mount where it would move the target), without a visible top-then-jump. Double-`rAF` alone is not acceptance.
- `pendingFragment` / block scroll continues to override session scroll for that open.
- No Welcome, second preview, find/replace, LLM, or semantic transaction work in this wave.

## Acceptance Criteria

### ui 观感约束（与 ADR 0008 一一对应，Studio 锁定）

1. **首屏**：宁可晚一帧完整 Reading Surface，不要半成品 chrome→正文再跳。
2. **字号**：首帧即 `editorFontSize`，禁止 default→override 肉眼跳动。
3. **恢复**：滚位/光标在内容就绪后一次套上；恢复过程勿再闪大纲激活态。

反例（一律拒）：骨架屏假装成正文、打开闪 Welcome、为稳另开第二预览面。验收只认 `office-view-markdown.markdownViewer`。

### 功能验收


Lead with ADR 0008 invariants (custom editor only — `office-view-markdown.markdownViewer`; stock Markdown does not count):

1. **首屏不闪** — Open MD via custom editor: no visible flash of half-finished / stock/empty Vditor layout or wrong theme (Light/Dark(/HC) smoke).
2. **字号一次到位** — First frame uses configured Editor Font Size; no default→override type-size jump.
3. **滚位/光标可恢复** — `cacheFocus`-family anchors applied only after content ready:
   - With `restoreViewState` **on**: reopen restores scroll **and** caret/selection (including CM block focus when that was saved).
   - With `restoreViewState` **off**: scroll still restores; caret/focus is not force-restored.

Also required under the same contract:

- Same document closed and reopened in-session: first paint + restore stable and repeatable.
- Long document (≥ multi-screen; with code blocks): restore lands at remembered viewport without obvious top→target jump or late undo of scroll.
- Outline/wiki fragment open: pending block target still honored.
- Build + existing unit suite green; targeted restore/boot tests where pure seams allow.

## Testing Decisions

- Unit: `documentState` / `cacheFocus` restore with `restoreCaret` true vs false; scroll key round-trip; host `shouldRestoreFocus` mirrors setting default.
- Unit/DOM where feasible: theme + font CSS variables present before content revealed (or equivalent boot guard).
- Manual / host smoke: open → scroll+caret → close tab → reopen; toggle `restoreViewState`; long fixture (e.g. extend `test/markdown/UxPolish.md` or a dedicated long MD); Light/Dark(/HC).
- Do not require full VS Code screenshot CI for this draft; agents should leave a short SMOKE-OPEN note when implementing.

## Out of Scope

- Semantic editing transactions / unified undo (architect next mainline after this wave)
- In-session caret continuity across DOM/CM boundaries (pain #2; not persisted open restore)
- Find/replace, Welcome, auto side preview, second preview surface, LLM/API keys
- Remote or bundled web fonts; new Reading Surface architecture
- Changing paste/table (ADR 0007) or failure-honesty AES (done)

## Further Notes

- Studio 2026-09-06: failure honesty closed (ui visual-signed); **this wave locked** against ADR 0008 for forge.
- Studio queue: failure honesty (DONE) → **open-doc stable** → semantic edit transactions (later).
- ADR 0007: “Second wave remains open-doc stability (no flicker / scroll restore).”
- Architect `ovm-next-ux-pain.md` treats 「打开即稳」 as already planned; do not pull P0 transaction item into this wave.
