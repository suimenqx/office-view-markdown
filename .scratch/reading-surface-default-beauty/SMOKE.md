# SMOKE — Reading Surface default beauty (ADR 0016)

Acceptance surface: `office-view-markdown.markdownViewer` only. Do not use the stock
Markdown preview/editor.

## Light sequence

1. Cold-open a typical Markdown doc. Primary toolbar shows ≤14 visible controls,
   does not wrap into a shelf, has a **single** theme entry (`editor-theme`), and does
   **not** show upload on the primary bar (upload / theme-toggle live under **more**).
2. Confirm type/measure: effective Editor Font Size ~16px (or follow VS Code when
   `office-view-markdown.editorFontSize` is `0`), line-height 1.75, reading
   measure about `min(100%, 52rem)` on the VS Code editor font family.
3. Under Auto, scan table / outline / toolbar / blockquote — chrome tracks
   `--vscode-*` (no third marketing skin).
4. Change theme, bump font size, adjust line-height. Tab stays clean; working
   tree stays byte-identical (ADR 0015 — no false dirty / no pretty rewrite).

## Dark / HC

5. Repeat appearance + no-dirty checks under Dark and High Contrast. Table,
   outline, toolbar, and blockquote remain coherent with `--vscode-*`
   (HC uses `--vscode-contrastBorder` fallbacks).

## Automated evidence (forge 2026-09-21 SGT)

- `node test/unit/toolbarComposition.test.js` — visible ≤14; no primary upload;
  single `editor-theme`; upload under more; right-anchored save/edit/theme/settings.
- `node test/unit/editorFontSize.test.js` — product default 16; `0` follows VS Code.
- `node test/unit/readingSurfaceDefaults.test.js` — line-height 1.75; measure
  `min(100%, 52rem)`; no remote font imports in Reading Surface less.
- `node test/unit/appearanceNoDirty.test.js` — Auto `--vscode-*` tokens present;
  appearance CSS paths do not call `fireContentInput` / `noteAuthoredIntent`;
  appearance patch leaves `isDocumentDirty` false (ADR 0015 intact).
- `npm run build` green; full `node test/unit/*.test.js` suite green.

Commits: `8350e29` (01 toolbar), `69e68e8` (02 type/measure), + 03 Auto/no-dirty
(this wave).

## Residual risks

- Full VS Code screenshots remain manual host checks (Light blocking; Dark/HC).
- More-menu / settings chrome polish beyond “upload reachable via more” is backlog.
- Line-height VS Code Settings contribution is explicitly out of this wave.
- Float:right packing depends on toolbar CSS; verify right cluster order on host.
- Users with a previously stored localStorage line-height / page-width keep their
  stored values until reset; product defaults apply to fresh profiles.
