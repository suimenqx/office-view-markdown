# Spec: 「Reading Surface 默认美」 / Reading Surface default beauty

Status: ready-for-agent

## Problem Statement

After ADR 0004–0015, the Reading Surface is capable and write-faithful, but **first open still feels like a dense tool cabinet** rather than a finished reading product. Studio evidence: primary toolbar carries upload plus **two** theme entries (`editor-theme` + `editor-theme-toggle`), often wrapping or crowding past a short primary set; default type still follows VS Code `editor.fontSize` (commonly 14) with a less deliberate measure/line-height; Auto chrome for table/outline/toolbar/blockquote is incomplete or uneven across Light/Dark/HC. Architect **ADR 0016** (`6af04ff`) names this as the next polish wave. This is **not** a new surface, **not** Option 2 density leftovers, and **not** a reopen of unintended write-back fidelity (ADR 0015).

## Solution

Lock **ADR 0016** Reading Surface default beauty for the existing custom editor (ADR 0004). Lead invariants:

> **Default open of `office-view-markdown.markdownViewer` prioritizes a finished reading surface over a dense tool cabinet: toolbar keeps a short primary set (outline; inline; block; undo/redo/find; right-anchored save / edit-in-vscode / single theme entry / settings), with upload and duplicate theme toggles off the primary bar (settings/more still reach them). Typography defaults to Editor Font Size 16px (keep `0` = follow VS Code), line-height 1.75, and reading measure about `min(100%, 52rem)`, still on the VS Code editor font family—no remote or bundled web fonts. Theme stays Auto with chrome tokens (table/outline/toolbar/blockquote) derived from `--vscode-*` across Light/Dark/HC; no third marketing skin. Changing theme, font size, or line-height must not dirty the document and must not pretty-normalize Markdown bytes (ADR 0015). Acceptance: first open looks intentional; primary bar ≤14 visible controls without wrap-shelf; Light/Dark/HC pass without false dirty.**

Close the default-beauty gap with three focused tickets: toolbar button retention / merge theme / drop upload from primary; default type + measure (16 / 1.75 / 52rem); Auto theme `--vscode-*` chrome tokens with appearance changes that never dirty or rewrite.

**ui 观感 — Studio locked (three must-fix)** — product-visible:

1. **短主栏**：primary toolbar ≤14 visible controls; merge theme into **one** entry; drop **upload** from the primary bar (settings/more still reach upload / extra theme).
2. **默认字号与栏宽**：Editor Font Size default **16px** via `office-view-markdown.editorFontSize` (keep `0` = follow VS Code); line-height **1.75**; reading measure **`min(100%, 52rem)`**; VS Code editor font family only.
3. **Auto + vscode tokens / 无假脏**：Auto theme; table / outline / toolbar / blockquote chrome from `--vscode-*` across Light/Dark/HC; changing theme / font size / line-height must **not** dirty the file and must **not** trigger ADR 0015 rewrite.

First acceptance surface: custom editor only — `office-view-markdown.markdownViewer`.

## User Stories

1. As a reader-editor, I open a Markdown file and see a short primary toolbar (≤14 visible controls) that does not wrap into a shelf; upload is not on the primary bar; theme is a single entry.
2. As a reader-editor, first open uses comfortable type: 16px default (or follow VS Code when config is `0`), line-height 1.75, and a reading measure about `min(100%, 52rem)` on the native editor font family.
3. As a reader-editor, Auto theme tables, outline, toolbar, and blockquotes track VS Code Light/Dark/HC via `--vscode-*` tokens without a third marketing skin.
4. As an author, I change theme, font size, or line-height and the document stays clean — no dirty flash, no Markdown byte rewrite (ADR 0015 intact).
5. As an author, I do not see Welcome, a second preview, remote/bundled web fonts, or a greenfield reopen of ADR 0015.

## Implementation Decisions

- Obey ADR 0004 (stay inside native WYSIWYG Reading Surface) and locked **ADR 0016** at `docs/adr/0016-reading-surface-default-beauty.md` (architect `6af04ff`).
- Consume ADR 0015 as a **closed** fidelity contract: appearance / chrome / type changes must not dirty or pretty-normalize; do **not** reopen 0015 as greenfield.
- **01 toolbar button retention** — primary set: outline; inline; block; undo/redo/find; right-anchored save / edit-in-vscode / **single** theme entry / settings. Drop `upload` from primary; merge `editor-theme` + `editor-theme-toggle` into one entry. Settings/more still reach upload and any secondary theme controls. Cap ≤14 visible primary controls; no wrap-shelf on typical Studio width.
- **02 default type + measure** — default `office-view-markdown.editorFontSize` effective **16px** (keep `0` = follow VS Code `editor.fontSize`); Reading Surface line-height **1.75**; content max-width **`min(100%, 52rem)`**. No remote or bundled web fonts; keep VS Code editor font family.
- **03 Auto theme + `--vscode-*` tokens** — strengthen Auto chrome for table / outline / toolbar / blockquote from `--vscode-*` across Light/Dark/HC. Changing theme / font size / line-height must not dirty host document and must not trigger ADR 0015 rewrite paths. No third marketing skin.
- **ui 观感 locked** — the three Studio items above; Light blocking; Dark/HC must pass for theme tokens / no false dirty.
- Acceptance only on `office-view-markdown.markdownViewer`. Stock Markdown preview/editor does not count.
- Prefer existing settings seams (`editorFontSize`, settings panel page-width / line-height locals, `resource/markdown/util.js` toolbar, `vditor/src/css/editor-theme/Auto.css`). Do not invent Welcome / LLM / second preview.
- Forge sequence **01 → 02 → 03**; estimate **2–4d**. 01 clears chrome density; 02 lands type/measure; 03 hardens Auto tokens + no-dirty appearance (depends on clean chrome paths from 01/02).

## Acceptance Criteria

### ui 观感约束（与 ADR 0016 一一对应，Studio 锁定）

1. **短主栏 ≤14**：primary bar shows ≤14 visible controls without wrap-shelf; theme is **one** entry; **upload** is off the primary bar (still reachable from settings/more).
2. **默认字号 / 行高 / 栏宽**：first open feels intentional — effective 16px (or follow VS Code when `editorFontSize` is `0`), line-height 1.75, measure ≈ `min(100%, 52rem)`; native VS Code font family only.
3. **Auto + vscode tokens / 改外观不脏**：table / outline / toolbar / blockquote track `--vscode-*` under Auto across Light/Dark/HC; changing theme / font size / line-height does not dirty the tab and does not rewrite Markdown bytes (ADR 0015).

反例（一律拒）：主栏超 14 / 双主题按钮 / upload 仍在主栏；默认像工具柜挤字；Light/Dark/HC 表格或 outline 脱节成第三皮；改主题或字号闪 dirty 或写回表格变漂亮。验收只认 `office-view-markdown.markdownViewer`。

### 功能验收

Lead with ADR 0016 invariant (custom editor only):

1. **Toolbar retention** — Primary toolbar matches the short set; ≤14 visible; single theme entry; upload off primary; settings/more still can reach upload / secondary theme.
2. **Default type + measure** — `office-view-markdown.editorFontSize` path yields 16px product default while `0` still follows VS Code; line-height 1.75; max-width `min(100%, 52rem)`; no remote/bundled web fonts.
3. **Auto `--vscode-*` chrome** — table / outline / toolbar / blockquote tokens derive from `--vscode-*` under Auto; Light/Dark/HC pass without a third marketing skin.
4. **Appearance ≠ write** — theme / font size / line-height changes do not dirty the document and do not pretty-normalize Markdown (ADR 0015 closed; evidence only).
5. **No new surface** — No Welcome, second preview, LLM, remote fonts, line-height Settings contribution this wave, or more-menu polish beyond backlog.
6. **First slice** — Issues 01 → 02 → 03 on `markdownViewer`; build + suite green with targeted tests / Light smoke where seams allow.

## Testing Decisions

- Unit / seam where pure: toolbar composition (visible count, upload absent, single theme name); effective font-size resolver default 16 vs `0` follow; CSS variable / measure application; appearance-change paths do not call write-back / do not dirty.
- Manual / host smoke on `markdownViewer` (Light blocking; Dark/HC for theme tokens + no false dirty): cold open → short bar + intentional type/measure; toggle theme / bump font size / line-height → tab stays clean, git clean; Auto table/outline/toolbar/blockquote look native under Light/Dark/HC.
- Agents leave a short SMOKE note when implementing; extend `.scratch/reading-surface-default-beauty/SMOKE.md`.
- Welcome / second preview / remote fonts / line-height VS Code Settings exposure / more-menu polish = out of gate (backlog).
- No PlantUML privacy / AES redesign tests; do not reopen ADR 0015 fixtures as greenfield (may reuse no-dirty evidence).

## Out of Scope

- **No new Reading Surface** — no Welcome, automatic side preview, second preview, source-mode replacement, LLM / API-key.
- **Remote or bundled web fonts** — stay on VS Code editor font family.
- **Exposing line-height in VS Code Settings** this wave → backlog (in-editor / local line-height may still ship the 1.75 default).
- **More-menu polish** beyond moving upload / secondary theme off the primary bar → backlog.
- **Do not reopen ADR 0015** as greenfield — fidelity stays closed; this wave must not regress no-intent write-back.
- **Do not reopen ADR 0007–0014** as greenfield.
- **Option 2** Reading Surface density leftovers (frontmatter chips polish, code-block micro-chrome, etc.) unless they fall out of default-beauty with evidence.
- PlantUML privacy / AES (0001–0003) stay closed.
- `_scratch` env hygiene (coco).

## Further Notes

- Studio 2026-09-21: intentional wave **locked** against ADR 0016 + ui Studio scheme; forge handoff 01 → 02 → 03.
- Forge: implement **01 → 02 → 03**; estimate **2–4d**.
- Studio queue: unintended-write-fidelity (DONE, ADR 0015) → **reading-surface-default-beauty** (this wave).
- Architect ADR 0016 (`6af04ff`) + Studio toolbar/type/Auto scheme drive this wave.
- Source anchors: `resource/markdown/util.js` (`getToolbar` — upload, dual theme); `vditor/src/ts/toolbar/EditorTheme*.ts`; `src/common/editorFontSize.ts` + `package.json` `office-view-markdown.editorFontSize`; `vditor/src/ts/ui/settingsPanel.ts` / `initUI.ts` (font / line-height / page-width); `vditor/src/css/editor-theme/Auto.css` (table/outline/toolbar/blockquote `--vscode-*`); host `markdownEditorProvider` appearance sync must not dirty (ADR 0015).
