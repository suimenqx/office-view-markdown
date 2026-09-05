# Outline / TOC 长标题截断：行业策略速查

调研日期：2026-09-05（UTC+8）。偏重可核验的产品行为 / 官方文档；非产品代码变更。

基线（已知）：**Markdown Viewer Enhanced** 类实现常见为固定窄栏约 **220–240px** + 单行 `ellipsis`（本仓库 vditor outline 已支持拖宽约 120–480px，仍多依赖 ellipsis）。

---

## 策略列表（名称 · 何时有用 · 代价）

- **固定窄栏 + 单行 ellipsis**：侧栏宽度预算固定、条目需等高可扫时（MVE 基线）。代价：区分度靠标题前缀，尾部信息丢失，无 tooltip 时几乎无法读全称。

- **Hover / title tooltip 显示全文**：截断已发生、用户偶发需要确认全称时（VS Code breadcrumbs 修复中明确「给 label 设 title」；TreeItem 默认可暴露 tooltip）。代价：依赖悬停，触控弱；tooltip 过长仍难读。

- **用户可拖宽侧栏 / 视图**：长标题是常态、用户愿牺牲正文宽度时（VS Code 侧栏可调；本仓库 outline 120–480px）。代价：占编辑区；窄屏仍会截断。

- **面包屑路径折叠（只显示 last / 关某段）**：层级深、横条空间比竖 TOC 更紧时（VS Code `breadcrumbs.filePath` / `symbolPath`：`on` | `off` | `last`）。代价：中间路径上下文消失，需点开或改设置才能恢复。

- **点击展开同级下拉（更宽列表）**：横条项被截断但需要浏览兄弟符号/文件时（VS Code breadcrumb dropdown；曾放宽 max-width 并设 title）。代价：多一步交互；下拉宽度仍受窗口约束。

- **迷你 TOC + Hover 展开完整列表**：希望常驻「在此页」但不长期占用宽栏时（Notion 官方：≥2 标题时右侧 TOC，**hover 展开**看到全部标题）。代价：未悬停时信息量低；主要利好指针设备。

- **作者侧短导航名（与正文标题分离）**：文档站左侧导航标题过长、可接受维护成本时（GitBook **link title** / `SUMMARY.md` 引号标签；Mintlify frontmatter **`sidebarTitle`**）。代价：不自动解决「页内 heading outline」；双标题需规范，易不一致。

- **允许多行换行显示全文**：标题语义必须完整可见、条目不多时（Obsidian 社区 Subtle TOC：多行 vs 单行+tooltip 可切换；Notion TOC **block** 随内容区变宽更易换行）。代价：大纲变高，扫描节奏差，深层级更挤。

- **大纲内关键字过滤 / 搜索**：标题长且数量多、用户记得关键词时（Typora Outline 官方支持 filter/search）。代价：不修复列表截断本身，发现依赖「先搜」。

- **按需 Outline 菜单（非常驻浮动 TOC）**：阅读面优先、避免窄栏截断问题 altogether 时（GitHub 官方：Markdown/README **无常驻浮动 TOC**；点渲染页 **Outline** 图标查看自动生成目录）。代价：无持续 scroll-spy 侧栏；多一次点击；第三方扩展才做浮动侧栏。

- **宽度自适应降级（全宽 / 紧凑 / FAB+模态）**：宿主页面边距不稳定（如 GitHub blob）时（第三方 github-markdown-toc-sidebar：≥260 / 160–259 / &lt;160 FAB）。代价：非一等公民体验；模态打断阅读流。

- **悬停预览章节内容（非补全标题）**：标题重复或截断后靠上下文辨认时（Obsidian Outline 支持 Ctrl+hover 预览；用户仍长期请求「悬停显示完整标题行」）。代价：预览≠补全 label；重复标题预览还曾对错锚点。

---

## 产品对照（摘录）

| 产品 | 与长标题相关的已知行为 |
|------|------------------------|
| VS Code Outline | 树列表 ellipsis；历史 bug 含 detail 溢出；全称依赖树/hover 体系，非「永远可读」 |
| VS Code Breadcrumbs | 截断 + 可配置路径密度；dropdown 加宽/title；可 Copy Breadcrumbs Path |
| Obsidian Outline | 窄栏截断；论坛长期要 hover 全文；Ctrl+hover 是内容预览 |
| Typora Outline | 官方强调导航/高亮/flat|collapse/**搜索过滤**，未主打短标题字段 |
| Notion | 右侧 page TOC：**hover 展开**；TOC block 在文内，改标题才能改 TOC 文案 |
| GitBook | 左栏导航可用 **link title** 缩短；另有页内 outline |
| Mintlify | 导航可用 **`sidebarTitle`**；另有右侧 `toc` |
| GitHub README | **无原生浮动 TOC**；Header **Outline** 菜单；浮动侧栏属扩展 |

## 主要来源

- VS Code Docs: Breadcrumbs（`filePath` / `symbolPath` / Copy path）
- VS Code #56318（breadcrumb truncation → 加宽 dropdown + title）
- Notion Help: Columns, headings & dividers（page-level TOC hover expand）
- GitBook Docs: Pages → Page link title；Changelog 2025（link titles）
- Mintlify Docs: Pages → `sidebarTitle`
- GitHub Docs / Changelog 2021-04-13：Markdown TOC / Outline 菜单
- Typora Support: Outline（filter/search, flat/collapse）
- Obsidian Forum: Outline hover 全文请求；Subtle TOC 插件说明
