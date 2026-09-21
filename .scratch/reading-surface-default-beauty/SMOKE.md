# SMOKE — Reading Surface default beauty (ADR 0016)

Acceptance surface: `office-view-markdown.markdownViewer` only. Do not use the stock
Markdown preview/editor.

## Light sequence (skeleton — fill during forge)

1. Cold-open a typical Markdown doc. Primary toolbar shows ≤14 visible controls,
   does not wrap into a shelf, has a **single** theme entry, and does **not**
   show upload on the primary bar.
2. Confirm type/measure: effective Editor Font Size ~16px (or follow VS Code when
   `office-view-markdown.editorFontSize` is `0`), line-height 1.75, reading
   measure about `min(100%, 52rem)` on the VS Code editor font family.
3. Under Auto, scan table / outline / toolbar / blockquote — chrome tracks
   `--vscode-*` (no third marketing skin).
4. Change theme, bump font size, adjust line-height. Tab stays clean; working
   tree stays byte-identical (ADR 0015 — no false dirty / no pretty rewrite).

## Dark / HC

5. Repeat appearance + no-dirty checks under Dark and High Contrast. Table,
   outline, toolbar, and blockquote remain coherent with `--vscode-*`.

## Automated evidence (fill when seams land)

- Toolbar composition / visible-count unit where pure.
- Font-size resolver default 16 vs `0` follow.
- Appearance-change paths do not schedule host write-back.
- `npm run build` and `node test/unit/*.test.js` green.

## Residual risks

- Full VS Code screenshots remain manual host checks.
- More-menu / settings reachability for upload is backlog polish if chrome is
  incomplete beyond “reachable.”
- Line-height VS Code Settings contribution is explicitly out of this wave.
