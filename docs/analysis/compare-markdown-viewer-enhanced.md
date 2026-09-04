# Office View Markdown vs Markdown Viewer Enhanced：设计与体验可借鉴分析

> 分析对象：
> - **Ours**：`/workspace/office-view-markdown`（Office View Markdown，Vditor WYSIWYG 自定义编辑器）
> - **Reference**：`/workspace/markdown-viewer-enhanced`（Markdown Viewer Enhanced / MVE，预览向扩展 + 共享 React UI）
>
> 目标：找出能让 Office View Markdown **更专业、更精致** 的设计与审美细节；不是功能清单抄袭。
> 日期：2026-09-05（Asia/Shanghai）

---

## 1. 摘要 / Executive summary

两个产品定位不同：OVM 是 **在 VS Code 里直接 WYSIWYG 编辑 Markdown** 的自定义编辑器；MVE 是 **侧栏预览 + 源码编辑辅助**（以及独立 Web/Electron 应用）的阅读/展示型产品。因此，不应照搬 MVE 的「预览面板 + LLM 改写」产品形态。

OVM 在主题 token 深度（`Auto.css` 大量映射 `--vscode-*`）、代码块/Mermaid/PlantUML chrome、设置浮层、Toast、Properties 面板等方面已经相当扎实。MVE 更突出的是 **预览文档的阅读美学与信息层级**：统一的设计 token（半径/阴影/过渡/字号）、Inter + JetBrains Mono 的排版气质、TOC 的「On this page」滚动高亮、GitHub Alerts 色阶、代码块「语言标签 + Copy」页眉、Frontmatter 轻量芯片展示、空态文案、Marketplace `galleryBanner`、以及 AI 交互的 **Progress + Open Settings** 失败路径。

**最值得立刻做的不是加功能，而是把「阅读表面」再打磨一层**：文档版心与字号可控、标题/表格/任务列表/图片的层级更像出版级预览、TOC 激活态更明显、GitHub Alerts 语义色、空/缺配置态更统一，以及 Marketplace 与设置呈现的专业感。

---

## 2. 产品定位对比（各自强项）

| 维度 | Office View Markdown | Markdown Viewer Enhanced |
|------|----------------------|--------------------------|
| 核心交互 | Custom Editor：文档即 WYSIWYG/IR 编辑面 | 预览 Webview（可侧开）+ 源码编辑器快捷键 |
| 引擎 | 自研 Vditor 分支 + Lute + CodeMirror 6 | react-markdown + remark/rehype 管线 |
| 主题 | 多套 Editor/CodeMirror/Mermaid 主题；`Auto` 深度跟 VS Code | `data-theme` + `vscode-theme.css` 映射；字号可调 |
| 图表 | Mermaid + **PlantUML（用户服务器）** | Mermaid |
| 知识库向 | Wiki links、Properties/frontmatter 可编辑 | Frontmatter 展示、TOC scroll-spy |
| AI | 无（刻意裁剪） | 右键子菜单 Rewrite with AI + Progress |
| 跨端 | Desktop + Web Extension Host | VS Code 扩展 + Web + Electron |
| 审美重心 | 编辑 chrome、浮层、与 VS Code 同构 | 阅读排版、预览 chrome、欢迎/空态 |

**OVM 强项（应保持，不要被参考产品带偏）：**

- 真正的就地编辑（非「看一眼再回源码改」）。
- 已有丰富的块级 chrome（`codeBlockChrome.ts`、mermaid/plantuml chrome）、设置面板（`_settingsPanel.less`）、Toast、outline、PlantUML 未配置占位（`_plantuml.less`）。
- `vditor/src/css/editor-theme/Auto.css` 对 VS Code CSS 变量的映射深度，通常超过 MVE 的两档 dark/light 映射。

**MVE 强项（适合「借美学，不借产品形态」）：**

- 预览正文像「独立阅读器」：版心约 820px、`line-height: 1.75`、标题下划线层级、表格大写表头、圆角任务复选框。
- 组件级 polish：CodeBlock 页眉、TOC 左边线激活、Frontmatter 图标芯片、WelcomeScreen 功能网格。
- 扩展商店与命令信息架构更「像正式产品」：`galleryBanner`、命令分类前缀、LLM 子菜单分组。

---

## 3. 可借鉴清单

### 3.1 统一设计 Token：半径、阴影、过渡、语义色阶

- **推荐细节**  
  在编辑器 CSS 根上补齐一套与内容无关的「产品 token」：`--radius` / `--radius-sm` / `--radius-lg`、`--shadow-sm|md|lg`、`--transition`、以及 `--success` / `--warning` / `--info` / `--error`（可继续从 `--vscode-charts-*` / `--vscode-errorForeground` 派生）。让表格圆角、代码块边框、占位卡片、Toast 共用同一套，而不是各写各的 `8px` / `3px`。

- **对方如何做的**  
  - `markdown-viewer-enhanced/vscode-extension/src/webview/styles/index.css`：`:root` 定义 `--radius*`、`--transition`、`--md-font-size`。  
  - `.../vscode-theme.css`：dark/light 两套 `--bg-*` / `--text-*` / `--accent` / `--success|warning|error|info` / `--shadow-*`，并优先 `var(--vscode-...)`。

- **推荐原因**  
  OVM 已有大量 `--border-color`、`--panel-shadow` 等，但半径与状态色仍分散（例如 Toast 硬编码绿、PlantUML 占位独立圆角）。统一 token 后，「随便哪一块 UI」都会立刻更像同一款专业产品。

- **优先级**：P0

- **落地提示**  
  - 扩展 `vditor/src/assets/less/index.less` 的 CSS 变量表。  
  - 同步到 `vditor/src/css/editor-theme/Auto.css`（以及必要时其它主题文件）。  
  - 逐步替换 `_toast.less`、`_plantuml.less`、`_codemirror.less`、`_reset.less` 中的魔法数字。

---

### 3.2 阅读表面：版心、字号、行高、标题层级

- **推荐细节**  
  1）为 WYSIWYG/IR 正文提供可配置的「阅读字号」（例如 12–28，步进 2），默认跟随 `--vscode-editor-font-size` 或独立 `previewFontSize`；  
  2）强化标题层级：`h1`/`h2` 底部分隔线、较小标题略降对比度；  
  3）保持舒适行高（MVE 预览为 1.75；OVM 已有 `--editor-line-height: 1.7`，可按模式微调）；  
  4）在宽屏下用已有 `--vditor-page-width` / fixed page width，形成明确版心，而不是无限拉宽。

- **对方如何做的**  
  - `useTheme.ts` + setting `markdownViewer.preview.fontSize`：运行时写 `--md-font-size`。  
  - `.markdown-body { max-width: 820px; line-height: 1.75; }`；`h1`/`h2` 带 `border-bottom`。  
  - Toolbar 提供 ZoomIn/ZoomOut 即时反馈。

- **推荐原因**  
  OVM 是编辑器，但用户打开 `.md` 的第一印象仍是「这篇文档好不好读」。字号与标题层级是最低成本的「专业感」。

- **优先级**：P0

- **落地提示**  
  - `package.json` contributes 增加 `office-view-markdown.editorFontSize`（或复用设置面板 stepper）。  
  - `vditor/src/ts/ui/settingsPanel.ts` + `_settingsPanel.less` 增加字号步进（你们已有 stepper-row 模式）。  
  - `_reset.less` / `_wysiwyg.less` / `_ir.less` 调整 heading 边框与 `h5`/`h6` 次级色。

---

### 3.3 TOC / Outline：滚动高亮与「On this page」信息架构

- **推荐细节**  
  强化 outline 激活态：左侧 2px accent 竖线 + 浅色背景（`--accent-subtle`）；header 使用小号大写字距（如 “ON THIS PAGE” / 本地化「本页目录」）；可折叠；窄屏隐藏或收入现有 mobile outline。保持你们已有的滚动偏移算法，只升级视觉。

- **对方如何做的**  
  - `src/components/TableOfContents.tsx`：`IntersectionObserver` + `toc-item--active`。  
  - webview CSS：`.toc-item--active button { border-left-color: var(--accent); background: var(--accent-subtle); }`；header `text-transform: uppercase; letter-spacing: 0.05em`。

- **推荐原因**  
  OVM 已有 outline 渲染与 active 逻辑（`outlineRender.ts`、`_reset.less` 的 `.vditor-outline__item--active`），但视觉上更像侧栏列表，不如 MVE「阅读器目录」那么一眼可扫。激活态是导航专业感的关键像素。

- **优先级**：P0

- **落地提示**  
  - 改 `vditor/src/assets/less/_reset.less` 中 `&-outline` 区块。  
  - 文案走 i18n（`vditor/src/js/i18n/*`），不要硬编码英文。

---

### 3.4 GitHub Alerts：语义色 blockquote

- **推荐细节**  
  识别 `> [!NOTE|TIP|WARNING|CAUTION|IMPORTANT]`（及常见变体），为 blockquote 增加 `alert--*` 类：左边框与浅底色分别映射 info/success/warning/error。普通引用保持现有 VS Code `textBlockQuote` token。

- **对方如何做的**  
  - `MarkdownRenderer.tsx` 的 `blockquote` 组件用正则抽 `[!NOTE]` 等。  
  - CSS：`.alert--note|tip|warning|caution|important` 使用 `--info/--success/--warning/--error` 半透明底。

- **推荐原因**  
  这是 GitHub / 大量文档仓库的既成语法；OVM 目前只有统一 blockquote（`_reset.less`）。语义色几乎不增加功能面，却立刻让「告警/提示」文档显得现代、可信。

- **优先级**：P1

- **落地提示**  
  - 解析：Lute/预处理或 WYSIWYG 渲染后处理（优先不破坏源码往返）。  
  - 样式：`_reset.less` + `Auto.css` 增加语义色变量。  
  - 样例可放 README / shortcut 文档一小节。

---

### 3.5 代码块页眉：可读语言名 + Copy 反馈

- **推荐细节**  
  在只读/预览观感上，让代码块顶部呈现「人类可读语言名」（TypeScript / Shell）与明确的 Copy → Copied 文案反馈；可与现有 `vditor-cm-chrome` 共存（编辑态保留语言搜索/主题/展开，展示态更安静）。

- **对方如何做的**  
  - `CodeBlock.tsx`：`LANGUAGE_DISPLAY` 映射 + Copy/Check 图标切换 2s。  
  - CSS：`.code-block-header` 分隔顶栏，语言 tertiary 色，按钮 hover 轻背景。

- **推荐原因**  
  OVM 的 chrome 功能更强，但「语言缩写 + 图标」有时不如「TypeScript · Copy code」直观。可读标签与明确反馈是专业工具常见细节。

- **优先级**：P1

- **落地提示**  
  - `vditor/src/ts/codeBlock/codeBlockChrome.ts` 的 `formatLanguageLabel` 扩展显示名映射。  
  - `_codemirror.less` 微调 header 排版与 copy 成功态（已有 `--cm-copy-done-color` 可复用）。

---

### 3.6 Frontmatter / Properties：轻量「芯片」与密集表格式并存

- **推荐细节**  
  保留 OVM 可编辑 Properties（强项），但增加一种 **compact chip 模式**：`author / date / tags` 横排图标+键值，适合短 frontmatter；长字段仍用表格。图标优先 Codicon，避免 emoji 在不同 OS 上不一致。

- **对方如何做的**  
  - `FrontmatterDisplay.tsx`：Lucide 按 key 选图标，`.frontmatter` flex wrap 芯片。  
  - 预览 App 把 YAML 从正文剥离后单独渲染。

- **推荐原因**  
  OVM 的 `.vditor-properties`（`_obsidian.less`）信息更完整，但默认视觉偏「重面板」。芯片模式让短元数据更像现代笔记/文档站，专业且不抢正文。

- **优先级**：P1

- **落地提示**  
  - `_obsidian.less` 增加 `--compact` modifier 或设置项 `frontmatterPresentation: table | chips`。  
  - 键图标改 Codicon（与 context menu / chrome 一致）。

---

### 3.7 空态 / 缺配置态：统一语气与行动点

- **推荐细节**  
  把「无内容、无标题、PlantUML 未配置、图加载失败、Mermaid 错误」收敛成同一套 empty/error 卡片：标题加粗、说明次级色、主按钮打开相关设置或重试。文案短、可行动（MVE 预览空态只有一句；OVM PlantUML 占位已更接近目标，可升级为全扩展模式）。

- **对方如何做的**  
  - webview `App.tsx`：`empty-state` 居中文案。  
  - 桌面端 `WelcomeScreen.tsx`：主 CTA + 功能网格（扩展场景可简化，借其结构而非整页营销）。  
  - LLM：`showWarningMessage` + **Open Settings**（`LlmService.ts`）。

- **推荐原因**  
  专业感很大程度来自「出错时用户知道下一步」。OVM 已有 PlantUML placeholder + 打开设置，应推广到更多失败面，并统一视觉语言。

- **优先级**：P1

- **落地提示**  
  - 以 `_plantuml.less` 的 placeholder 为基准组件化（class 约定即可）。  
  - Mermaid error（参考 MVE `.mermaid-error`）对齐到同一卡片样式。  
  - 主机侧失败继续用 `vscode.window.showWarningMessage(..., 'Open Settings')`。

---

### 3.8 Marketplace 与设置信息架构

- **推荐细节**  
  1）`package.json` 增加 `galleryBanner`（深色底更贴 VS Code 商店审美）；  
  2）`categories` 考虑加入与 Markdown 更相关的分类（在合规前提下）；  
  3）命令统一 `category: "Office View Markdown"`；  
  4）设置项继续用 `markdownDescription` + `order`（你们 PlantUML 已做得很好），关键项给示例与「未配置时行为」。

- **对方如何做的**  
  - `vscode-extension/package.json`：`galleryBanner: { color: "#0d1117", theme: "dark" }`；命令标题带产品前缀；LLM 用 submenu 分组。

- **推荐原因**  
  用户在安装前就会「感觉这是不是认真做的产品」。商店横幅与命令分类几乎零运行时成本。

- **优先级**：P0（galleryBanner / category 文案） · P2（更大范围命令整理）

- **落地提示**  
  - 改根目录 `package.json` + `package.nls*.json`。  
  - 可选：`image/` 增加商店用 banner 色值说明，不必真做大图。

---

### 3.9 表格、任务列表、图片：内容块「完成度」

- **推荐细节**  
  - 表格：外层圆角裁切 + thead 略强调（不一定要全大写，可适度 letter-spacing）；行 hover。  
  - 任务列表：自定义 checkbox（圆角、勾选填 accent）。  
  - 图片：圆角 + 细边框 + 轻阴影；有 alt/title 时显示 figcaption。

- **对方如何做的**  
  - `.table-wrapper` + thead 样式；`:has(input[type=checkbox])` 任务列表；`.md-figure` 图片与 figcaption。

- **推荐原因**  
  这些是用户滚动文档时最高频看到的块。OVM 表格已有主题 token，但「出版级」细节（圆角容器、任务勾选美学、图片说明）仍可加强。

- **优先级**：P1

- **落地提示**  
  - `_reset.less` 表格/列表/图片段落。  
  - 注意 WYSIWYG 可编辑性：自定义 checkbox 需不破坏点击切换任务状态。

---

### 3.10 链接、行内代码、分隔线的微观交互

- **推荐细节**  
  链接 hover 时出现底边；行内代码带细边框与略强调色；`hr` 用 1px token 色而非过重边框。

- **对方如何做的**  
  - `a { border-bottom: 1px solid transparent; }` → hover 显色。  
  - `.inline-code`：mono + padding + border + accent 色。

- **推荐原因**  
  微观动效让界面「活着」，且与 VS Code 链接色 token 天然兼容。

- **优先级**：P2

- **落地提示**  
  - `_reset.less` 链接与 `code` 规则；Auto 主题下用 `--link-color` / `--code-bg-color`。

---

### 3.11 AI UX 模式（即使暂不做 AI 功能也可学）

- **推荐细节**  
  任何「需要外部能力」的功能（PlantUML 服务器、未来 AI、远程图）：  
  1）右键/命令入口分组清晰；  
  2）执行中用 `withProgress`；  
  3）失败提供 **Open Settings** 一键跳转；  
  4）不要静默失败。

- **对方如何做的**  
  - `package.json` submenu `markdownViewer.llm` 分组 1_rewrite / 2_fix / 3_custom。  
  - `LlmService.rewrite`：`ProgressLocation.Notification` + cancellable；无 provider 时警告并打开 `markdownViewer.llm` 设置。

- **推荐原因**  
  OVM 已在 PlantUML 路径上接近这一模式。把同一交互语法固化，可避免日后加能力时 UX 分裂。

- **优先级**：P2（模式沉淀） · 不做完整 LLM 功能（见第 4 节）

- **落地提示**  
  - 抽象小型 helper：`showActionableWarning(message, settingQuery)`。  
  - 文档 ADR 记「外部依赖功能的 UX 契约」。

---

### 3.12 预览滚动与锚点体验

- **推荐细节**  
  标题 `scroll-margin-top`；outline 点击平滑滚动（你们已有 `scrollOutlineTarget`，可评估 `behavior: 'smooth'` 是否符合 VS Code 习惯——可设置开关）。

- **对方如何做的**  
  - `.markdown-body h* { scroll-margin-top: 20px; }`；TOC `scrollIntoView({ behavior: 'smooth' })`。

- **推荐原因**  
  减少「点了目录但标题贴顶被工具栏挡住」的廉价感。

- **优先级**：P2

- **落地提示**  
  - `_reset.less` 增加 `scroll-margin-top`；与 `OUTLINE_SCROLL_OFFSET` 对齐。

---

## 4. 不建议照搬的点（及原因）

1. **整页 WelcomeScreen / 功能营销网格**  
   OVM 打开的是用户自己的 `.md` 文件，不是空应用。整页欢迎会打断编辑心流；只需保留轻量空文档 placeholder。

2. **强制 Auto-open Preview 侧栏**  
   MVE 的 `preview.autoOpen` 适合「源码 + 预览」工作流；OVM 本身就是编辑面，再自动开预览会造成双表面与性能浪费。

3. **完整 LLM 改写产品面（API Key 设置、多 Provider）**  
   与当前 OVM「Markdown-only、已裁剪 AI」方向冲突；安全与支持成本高。若未来要做，应优先 `vscode.lm`，并沿用第 3.11 的 UX 契约，而不是复制 MVE 的密钥配置 UI。

4. **Google Fonts（Inter / JetBrains Mono）远程加载**  
   Webview/扩展离线、隐私与 CSP 都不友好。应继续优先 `--vscode-editor-font-family` / `--vscode-editor-font-size`，或打包本地字体子集（若真要品牌字体）。

5. **桌面 Electron 文件管理侧栏 / 多文件 Tabs**  
   那是独立 App 的信息架构，VS Code 已有资源管理器与标签页；再做一层只会重复且不一致。

6. **把 OVM 改成「只读预览扩展」**  
   会丢掉相对 MVE 的核心差异化（WYSIWYG）。学习其阅读美学即可。

7. **两套独立 dark/light 硬编码色板覆盖 Auto**  
   MVE 的 `#0f1117` 气质漂亮，但 OVM 的价值是跟用户主题走。应「token 结构化 + Auto 映射」，而不是换一套固定皮肤压过 VS Code。

---

## 5. 建议的落地顺序（短路线图）

### Phase A — 一周内可见的「专业感」（P0）

1. 补齐全局 design tokens（半径/阴影/过渡/语义色）并落到 Auto 主题。  
2. Marketplace：`galleryBanner` + 命令 category 统一。  
3. Outline 激活态（左边线 + accent 底）与目录标题层级文案。  
4. 正文阅读：字号设置（设置面板 stepper）+ `h1`/`h2` 分隔线微调。

### Phase B — 内容块精致度（P1）

5. GitHub Alerts 语义样式（保证源码往返安全）。  
6. 表格容器 / 任务列表 / 图片 figcaption。  
7. 代码块可读语言名 + Copy 文案反馈。  
8. Frontmatter compact chips（可选）+ Codicon 图标。  
9. 统一 empty/error/placeholder 卡片（PlantUML / Mermaid / 加载失败）。

### Phase C — 微观与模式沉淀（P2）

10. 链接 hover 底边、行内代码边框等微观交互。  
11. `scroll-margin-top` / 平滑滚动开关。  
12. 外部依赖功能的 Progress + Open Settings UX 契约文档化（为未来能力预留，不急着做 AI）。

### 验收建议（体验向）

- 同一份含 frontmatter、表格、任务列表、代码块、`[!NOTE]`、Mermaid、长目录的样例文档，在 Light / Dark / 高对比主题下截图对比。  
- 未配置 PlantUML 与 Mermaid 语法错误时，占位是否同族、是否有明确下一步。  
- 设置面板改字号是否即时反映到正文，且与 VS Code 配置同步策略一致。

---

## 附录：关键参考路径

**MVE**

- `vscode-extension/package.json` — 命令/设置/galleryBanner  
- `vscode-extension/src/webview/styles/vscode-theme.css` — VS Code 变量映射  
- `vscode-extension/src/webview/styles/index.css` — 预览美学主样式  
- `vscode-extension/src/webview/App.tsx` — 空态、字号、frontmatter、TOC 组装  
- `src/components/{WelcomeScreen,Toolbar,TableOfContents,FrontmatterDisplay,CodeBlock,MarkdownRenderer}.tsx`  
- `vscode-extension/src/llm/LlmService.ts` — Progress + Open Settings

**OVM**

- `package.json` / `package.nls*.json` — contributes  
- `vditor/src/css/editor-theme/Auto.css` — 主题 token  
- `vditor/src/assets/less/{index,_reset,_settingsPanel,_toast,_obsidian,_plantuml,_codemirror}.less`  
- `vditor/src/ts/codeBlock/codeBlockChrome.ts` / `frontMatterEditor.ts`  
- `vditor/src/ts/markdown/outlineRender.ts`  
- `vditor/src/ts/ui/{settingsPanel,toast}.ts`  
- `resource/markdown/index.css` — webview chrome（context menu 等）  
- `src/provider/markdownEditorProvider.ts` — 自定义编辑器宿主

---

*本报告仅作设计/体验分析，不修改任一产品的功能实现。*
