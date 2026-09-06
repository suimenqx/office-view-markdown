# Smoke: open AES fixture in custom editor

Stock `code file.md` often lands in the default Markdown text editor. Force Office View Markdown with one of:

## A. One-shot script (recommended)
```bash
./test/smoke/open-aes-fixture.sh               # uses editorAssociations in temp user-data
./test/smoke/open-aes-fixture.sh dist/*.vsix   # install vsix first, then open
```

## B. After vsix install in your normal profile
1. `Developer: Reload Window`
2. Open `test/markdown/FailureHonestyAES.md`
3. Run `office-view-markdown.switch` (or `Ctrl+Alt+E` / Mac `Ctrl+Cmd+E`)
4. Or Command Palette → `View: Reopen Editor With…` → **Office View Markdown**

## C. Sticky association (workspace/user settings)
```json
"workbench.editorAssociations": {
  "*.md": "office-view-markdown.markdownViewer"
}
```

`viewType`: `office-view-markdown.markdownViewer`
