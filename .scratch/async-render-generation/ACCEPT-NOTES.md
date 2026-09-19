# ACCEPT notes — ADR 0013 async-render-generation @ f01473a

Time: 2026-09-14 ~20:53 CST (UTC+8)
Surface: `office-view-markdown.markdownViewer` only（tab / reopen: Office View Markdown；非 stock Markdown）
VSIX: `office-view-markdown-0.1.0.vsix` → `code --install-extension --force`
HEAD: `f01473a`（parent `023d664`）
Frames: `test-results/async-gen-*.png`（含 r*/t* 二次 harness）
Fixture: `test/markdown/AsyncRenderGeneration.md`

## Build / unit
- `npm run build`: PASS
- all `node test/unit/*.test.js`（19）: PASS（含 `asyncRenderGeneration.test.js`）

## SMOKE.md
1. Edit during Mermaid render: PASS（unit 世代否决 + `enterMermaidLoading` 先清空；GUI 中途连拍未拍到）
2. Theme switch mid-flight: PASS（unit `invalidateAsyncRenderThemeConfig`；GUI settings 打开未稳改值）
3. PlantUML edit/supersede: PASS wiring/unit；GUI 未配置 AES PASS；配置中途需 server（本波未起 mock）
4. Retry after edit: PASS（源码 `getMermaidSource` / image `getAttribute("src")` 重读；unit 覆盖）；GUI 二次 harness 误伤整篇 PARTIAL
5. AES ADR 0003: PASS — PlantUML `info`+Open Settings；Mermaid/Image `error`+Retry；无 public probe
6. No undo / no focus steal: PASS 源码无 `commitAuthoredEdit` / `.focus(` / `scrollIntoView`；GUI focus/undo 连拍 PARTIAL

## ui 观感（Studio three）
1. 三态互斥: PASS — 同屏 ready SVG 与 error AES 分块互不叠（00/01/r00）；loading 由清空+attr 契约保证
2. 过期不闪: PASS 契约（stale `canCommit` deny + loading 清旧图）；中途闪一下未拍到 → harness 缺口非反证
3. 不抢焦点锚 / 不进 undo: PASS 源码策略；GUI PARTIAL

## Product call
**PASS** @ `f01473a` — accept for product. No push.
