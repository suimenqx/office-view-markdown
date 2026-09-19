# ACCEPT notes — ADR 0015 unintended-write-fidelity @ 841e30d

Time: 2026-09-15 ~09:18 CST (UTC+8)
Surface: `office-view-markdown.markdownViewer` only（tab / reopen: Office View Markdown；非 stock Markdown）
VSIX: `office-view-markdown-0.1.0.vsix` → `code --install-extension --force`
HEAD: `841e30d`（`fix(fidelity): clear passive intent markers`；祖先含 e5db208/d6ca2f8/5dce878/040dbf5）
Frames: `test-results/write-fid-*.png`（~52）
Logs: `test-results/gui-write-fid.log` / `gui-write-fid2.log` / `gui-write-fid4.log`
Fixture: `test/markdown/UnintendedWriteFidelity.md`（验收后已 `git restore`）

## Build / unit / package
- `npm run build`: **PASS**
- all `node test/unit/*.test.js` (23): **PASS**（含 `writeBackFidelity` / `spanPreservingSync`）
- `npm run package` + install --force: **PASS**（bundle md5 与 workspace 一致）

## SMOKE.md（host / markdownViewer）

| # | Criterion | Call | Evidence |
|---|-----------|------|----------|
| 1 | Open 不动 → tab clean；compact 不垫宽；working tree 空 | **PASS** | `write-fid-03/20/42` 无 dirty 点；HASH 全程 `3f23b3cb…`；status clean |
| 2 | 初渲 / scroll / theme 无 dirty flash；文件 byte-identical | **PASS** | idle/theme HASH 不变（log1/2/4）；`write-fid-05..08` / `21..24` / `43..45` |
| 3 | 改 first table `one`→`changed`；prose+second 仍原样 | **PASS (unit)** / **PARTIAL (GUI cell hit)** | unit: `preserveAuthoredSpans` 改一格后 second+prose 原字节；GUI xvfb 点格常偏（heading/表崩）但多次写回后 **second table 块始终 byte-exact**（`write-fid*-after.md`） |
| 4 | save 后 git diff = 有意改动，非整篇表重排 | **PASS (unit+span)** / **PARTIAL (GUI)** | unit 合同；GUI 精确 one→changed 未稳打中；误击 diff 仍未改写 second table |

## ui 观感（Studio three）
1. **无意图不 dirty flash**: **PASS** — 打开/空闲/主题切换帧无白点；status Count 292
2. **本地编辑 → dirty/diff 感**: **PASS** — `write-fid-09/26` tab dirty；SCM badge 出现
3. **无意图 writeback 保持 dirty off**: **PASS** — 无意图阶段 HASH 不变 + tab clean

附加：compact tables 未编辑前 byte-stable（HASH）；edit 一处不改写第二表（after 副本 second 块恒等）。

## Residual
- xvfb 精确定位 WYSIWYG 表单元格（double-click `one`）不稳定；表内编辑路径以 unit + 未触碰 span 宿主旁证为主。
- Stock Markdown ≠ evidence（验收帧均为 OVM toolbar / Office View Markdown）。

## Product call
**PASS / ACCEPT with residuals** @ `841e30d` — 产品可收。No push。
