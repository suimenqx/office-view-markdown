# Silent failure inventory (pre-spec scan)

Scope: image / PlantUML / Mermaid failure honesty for next mainline.
Status: forge push done; waiting on architect ADR 0003 expand + product/ui spec.

## Existing AES surface
- ADR 0003 actionable external dependency UX
- CSS: `vditor-actionable-empty-state*` in `_reset.less`
- Unit: `test/unit/actionableEmptyState.test.js`

## Candidate code seams
- `vditor/src/ts/codeBlock/codeBlockChrome.ts` — plantuml,mermaid
- `vditor/src/ts/codeBlock/codeBlockHighlightLanguages.ts` — plantuml,mermaid
- `vditor/src/ts/codeBlock/codeMirrorManager.ts` — plantuml,mermaid,AES
- `vditor/src/ts/codeBlock/codeMirrorPreviewRender.ts` — plantuml,mermaid
- `vditor/src/ts/codeBlock/codeMirrorRichCopy.ts` — plantuml,mermaid
- `vditor/src/ts/constants.ts` — plantuml,mermaid
- `vditor/src/ts/markdown/adapterRender.ts` — plantuml,mermaid
- `vditor/src/ts/markdown/codeRender.ts` — plantuml,mermaid
- `vditor/src/ts/markdown/mermaidChrome.ts` — mermaid,has-catch
- `vditor/src/ts/markdown/mermaidRender.ts` — mermaid,AES,has-catch
- `vditor/src/ts/markdown/mermaidTheme.ts` — mermaid
- `vditor/src/ts/markdown/plantumlChrome.ts` — plantuml
- `vditor/src/ts/markdown/plantumlRender.ts` — plantuml,AES,has-catch
- `vditor/src/ts/markdown/plantumlUrl.ts` — plantuml
- `vditor/src/ts/preview/image.ts` — img
- `vditor/src/ts/preview/imageFigure.ts` — img
- `vditor/src/ts/ui/actionableEmptyState.ts` — AES
- `vditor/src/ts/ui/chromePopoverDismiss.ts` — mermaid
- `vditor/src/ts/ui/initUI.ts` — mermaid
- `vditor/src/ts/ui/mermaidThemeCatalog.ts` — mermaid
- `vditor/src/ts/ui/mermaidThemePickerPanel.ts` — mermaid
- `vditor/src/ts/ui/setEditorTheme.ts` — mermaid
- `vditor/src/ts/ui/setMermaidTheme.ts` — mermaid
- `vditor/src/ts/ui/themePickerPanel.ts` — mermaid
- `vditor/src/ts/undo/index.ts` — plantuml
- `vditor/src/ts/util/Options.ts` — plantuml,mermaid
- `vditor/src/ts/util/cacheFocus.ts` — mermaid
- `vditor/src/ts/util/editorCommonEvent.ts` — plantuml,img,AES
- `vditor/src/ts/util/fixBrowserBehavior.ts` — img
- `vditor/src/ts/util/linkClick.ts` — plantuml,img
- `vditor/src/ts/util/processCode.ts` — plantuml,mermaid
- `vditor/src/ts/wysiwyg/highlightToolbarWYSIWYG.ts` — plantuml,img
- `vditor/src/ts/wysiwyg/index.ts` — plantuml
- `vditor/src/ts/wysiwyg/renderDomByMd.ts` — plantuml,mermaid

## UI contract (from Studio, do not invent panels)
| Scene | Primary action |
| --- | --- |
| Unconfigured (PlantUML) | Open Settings |
| Render fail (Mermaid / configured PlantUML) | Retry |
| Broken image | Retry |

## Forge next
- Idle until product/architect lock spec + ADR scope.
- Do not start implementation until ticket lands.

## Quick gap read (forge)
- PlantUML / Mermaid: already call `renderActionableEmptyState` (unconfigured + render fail paths exist).
- Images: `editorCommonEvent.markImageLoading` already swaps broken img into AES host + Retry.
- Likely work is **copy/tone + visual variant alignment** with UI table (info vs warning/error bar), not greenfield AES.
- Watch for silent holes: preview-only paths, PlantUML img chrome vs AES race, Mermaid catch message quality, settings callback wiring in webview.

## Do not start coding
Wait for architect ADR 0003 expand + product ticket.
