# 02: Editor Font Size + Reading Surface type

**What to build:** Users can set Editor Font Size from VS Code Settings and from the in-editor settings panel stepper (12–28, step 2). Default follows the VS Code editor font size until overridden. Reading Surface heading hierarchy and wide-screen measure feel more published, using existing page-width behavior (no hard-coded 820-only setting). Typography uses the VS Code editor font family (no remote/bundled web fonts).

**Blocked by:** 01 Design Tokens foundation

**Status:** ready-for-agent

- [ ] Setting `office-view-markdown.editorFontSize` exists with markdownDescription and sensible order
- [ ] In-editor settings panel stepper adjusts the same value and updates the Reading Surface
- [ ] Default follows VS Code editor font size until the user overrides
- [ ] Heading hierarchy polish lands without breaking WYSIWYG editing
- [ ] No Inter / JetBrains Mono / Google Fonts introduced
