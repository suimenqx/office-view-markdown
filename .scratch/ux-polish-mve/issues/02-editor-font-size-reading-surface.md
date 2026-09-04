# 02: Editor Font Size + Reading Surface type

**What to build:** Users can set Editor Font Size from VS Code Settings and from the in-editor settings panel stepper (12–28, step 2). Default follows the VS Code editor font size until overridden. Reading Surface heading hierarchy and wide-screen measure feel more published, using existing page-width behavior (no hard-coded 820-only setting). Typography uses the VS Code editor font family (no remote/bundled web fonts).

**Blocked by:** 01 Design Tokens foundation

**Status:** done

- [x] Setting `office-view-markdown.editorFontSize` exists with markdownDescription and sensible order
- [x] In-editor settings panel stepper adjusts the same value and updates the Reading Surface
- [x] Default follows VS Code editor font size until the user overrides
- [x] Heading hierarchy polish lands without breaking WYSIWYG editing
- [x] No Inter / JetBrains Mono / Google Fonts introduced

**Comments:** Added the host-side editor font-size resolver and configuration synchronization, the Vditor public setter and callback, and a 12–28px settings stepper with 2px increments. Existing Ctrl/Cmd-wheel zoom now follows the host-owned value in the extension while retaining legacy local-storage behavior for standalone Vditor, and the production stepper uses the same clamp seam. The Reading Surface now follows VS Code editor font family, has a 72rem maximum measure while preserving explicit page-width overrides, and uses published-style h1/h2 rules with muted h5/h6. Verified with `node test/unit/editorFontSize.test.js`, `node test/unit/plantumlServer.test.js`, and `npm run build`. Root/Vditor type-check commands remain blocked by pre-existing PlantUML narrowing and stale Vditor tsconfig issues.
