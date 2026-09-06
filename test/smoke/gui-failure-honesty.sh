#!/usr/bin/env bash
set -euo pipefail
CODE_BIN=/usr/bin/code
USER_DATA=$(mktemp -d /tmp/ovm-aes-ud-XXXXXX)
RESULTS=/workspace/_shared/office-view-markdown/test-results
LOG=$RESULTS/gui-failure-honesty.log
mkdir -p "$RESULTS" "$USER_DATA/User"
cat > "$USER_DATA/User/settings.json" << 'JSON'
{
  "workbench.startupEditor": "none",
  "workbench.welcomePage.walkthroughs.openOnInstall": false,
  "telemetry.telemetryLevel": "off",
  "window.restoreWindows": "none",
  "workbench.editorAssociations": {
    "*.md": "office-view-markdown.markdownViewer",
    "*.markdown": "office-view-markdown.markdownViewer"
  },
  "security.workspace.trust.enabled": false,
  "office-view-markdown.editMode": "wysiwyg",
  "office-view-markdown.mermaidTheme": "Light",
  "office-view-markdown.plantuml.server": ""
}
JSON
printf '%s\n' '{"enable-crash-reporter":false}' > "$USER_DATA/argv.json"
rm -f "$LOG" "$RESULTS"/aes-*.png
echo "USER_DATA=$USER_DATA" > "$LOG"
echo "started=$(date -Iseconds)" >> "$LOG"
export ELECTRON_DISABLE_SANDBOX=1
export LIBGL_ALWAYS_SOFTWARE=1

# Inline ffmpeg shots inside nested shell (functions do not cross bash -c)
xvfb-run -a -s '-screen 0 1600x900x24' env ELECTRON_DISABLE_SANDBOX=1 LIBGL_ALWAYS_SOFTWARE=1 \
  bash /workspace/_shared/office-view-markdown/test/smoke/gui-failure-honesty-inner.sh "$USER_DATA" "$RESULTS" "$LOG" "$CODE_BIN"
echo EXIT=$?
ls -la "$RESULTS"/aes-*.png 2>/dev/null || true
tail -80 "$LOG"
