# 02: Default type + measure (16 / 1.75 / 52rem)

**What to build:** ADR 0016 residual (2). Reading Surface defaults must feel published on first open: Editor Font Size effective **16px** via `office-view-markdown.editorFontSize` while keeping **`0` = follow VS Code** `editor.fontSize`; line-height **1.75**; reading measure about **`min(100%, 52rem)`**. Stay on the **VS Code editor font family** — no remote or bundled web fonts. Prefer existing seams: `src/common/editorFontSize.ts` + package contribution default/docs, `vditor/src/ts/ui/initUI.ts` / `settingsPanel.ts` (font / line-height / page-width locals), Reading Surface CSS variables. **Do not** contribute line-height to VS Code Settings this wave (backlog). Do not invent a measure settings proliferation beyond the locked default.

**Blocked by:** Forge sequence after 01 (chrome density first). Coordinate with 03 so font/line-height changes never dirty (ADR 0015).

**Status:** resolved

**ui 观感：** 默认 16 / 1.75 / ~52rem；原生字体；首开即成品感。

- [x] Product default yields ~16px on first open; `editorFontSize: 0` still follows VS Code
- [x] Line-height default 1.75 on Reading Surface content
- [x] Content max-width ≈ `min(100%, 52rem)` on wide screens
- [x] No remote / bundled web fonts; VS Code editor font family only
- [x] No VS Code Settings exposure of line-height this wave
- [x] Light smoke + unit at font-size resolver / CSS var seams; build green

## Comments

- Product lock 2026-09-21 (SGT): Studio scheme + ADR 0016. Today `editorFontSize` default `0` resolves through VS Code (often 14) via `getEffectiveEditorFontSize`; page-width / line-height live in settings-panel locals — land the locked defaults without a new surface.
- Forge 2026-09-21 (SGT): implemented; commit `69e68e8` (wave ADR 0016). Build + unit green.
