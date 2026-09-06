#!/usr/bin/env bash
set -euo pipefail
ROOT=/workspace/_shared/office-view-markdown
CODE_BIN=/usr/bin/code
USER_DATA=$(mktemp -d /tmp/ovm-opendoc-ud-XXXXXX)
RESULTS="$ROOT/test-results"
LOG=$RESULTS/gui-open-doc-stable.log
INSTALLED_EXT=/home/box/.vscode/extensions/suimenqx.office-view-markdown-0.1.0
if [ -d "$INSTALLED_EXT" ]; then
  EXT_PATH="$INSTALLED_EXT"
else
  EXT_PATH=/workspace/_shared/office-view-markdown
fi
mkdir -p "$RESULTS" "$USER_DATA/User"
cat > "$USER_DATA/User/settings.json" << 'JSON'
{
  "workbench.startupEditor": "none",
  "workbench.welcomePage.walkthroughs.openOnInstall": false,
  "telemetry.telemetryLevel": "off",
  "window.restoreWindows": "none",
  "files.hotExit": "off",
  "security.workspace.trust.enabled": false,
  "workbench.colorTheme": "Default Light Modern",
  "editor.fontSize": 13,
  "workbench.editorAssociations": {
    "*.md": "office-view-markdown.markdownViewer",
    "*.markdown": "office-view-markdown.markdownViewer"
  },
  "office-view-markdown.editMode": "wysiwyg",
  "office-view-markdown.editorFontSize": 22,
  "office-view-markdown.restoreViewState": true,
  "office-view-markdown.plantuml.server": ""
}
JSON
printf '%s\n' '{"enable-crash-reporter":false}' > "$USER_DATA/argv.json"
rm -f "$LOG" "$RESULTS"/open-doc-*.png
echo "USER_DATA=$USER_DATA" > "$LOG"
echo "started=$(date -Iseconds)" >> "$LOG"
export ELECTRON_DISABLE_SANDBOX=1
export LIBGL_ALWAYS_SOFTWARE=1

xvfb-run -a -s '-screen 0 1600x900x24' env ELECTRON_DISABLE_SANDBOX=1 LIBGL_ALWAYS_SOFTWARE=1 \
  bash -c '
    set -euo pipefail
    xfwm4 --daemon 2>/dev/null || xfwm4 --replace >/tmp/xfwm4-opendoc.log 2>&1 &
    sleep 1
    bash "'"$ROOT"'/test/smoke/gui-open-doc-stable-inner.sh" \
      "'"$USER_DATA"'" "'"$RESULTS"'" "'"$LOG"'" "'"$CODE_BIN"'" "'"$EXT_PATH"'" \
      "'"$ROOT"'/test/markdown/UxPolish.md" "'"$ROOT"'/test/markdown/LongOpen.md"
  '
echo EXIT=$?
ls -la "$RESULTS"/open-doc-*.png 2>/dev/null | wc -l
tail -30 "$LOG"
