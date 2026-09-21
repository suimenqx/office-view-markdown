# 03: Auto theme + `--vscode-*` tokens (no dirty on appearance)

**What to build:** ADR 0016 residual (3). Keep theme **Auto** as the product default. Strengthen chrome for **table / outline / toolbar / blockquote** so tokens derive from **`--vscode-*`** and stay coherent across **Light / Dark / HC** — no third marketing skin. Changing **theme, font size, or line-height** must **not** dirty the host document and must **not** pretty-normalize Markdown bytes (**ADR 0015 closed** — evidence only, do not reopen as greenfield). Prefer `vditor/src/css/editor-theme/Auto.css` and appearance sync paths in host/webview; ensure theme/font/line-height updates skip write-back / dirty pulse.

**Blocked by:** Forge sequence after 01 → 02; uses short chrome + type/measure paths. Prove no-dirty against ADR 0015 contracts.

**Status:** resolved

**ui 观感：** Auto 跟 vscode；改外观不闪 dirty、不写回。

- [x] Auto table / outline / toolbar / blockquote chrome use `--vscode-*` (or clear fallbacks)
- [x] Light / Dark / HC coherent without a third marketing skin
- [x] Theme / font size / line-height change → tab stays clean; bytes unchanged (ADR 0015)
- [x] No ADR 0015 greenfield reopen / no pretty-format-as-feature
- [x] Light + Dark/HC smoke; unit where appearance≠write seams allow; build green

## Comments

- Product lock 2026-09-21 (SGT): Studio scheme + ADR 0016. Auto.css already maps many `--vscode-*` tokens; close residual gaps for table/outline/toolbar/blockquote and hard-gate appearance paths against false dirty.
- Forge 2026-09-21 (SGT): implemented; commit `5ffb03f` (wave ADR 0016). Build + unit green.
