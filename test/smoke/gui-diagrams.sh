#!/usr/bin/env bash
set -euo pipefail
CODE_BIN=/workspace/vscode-extension-dev/hello-extension/.vscode-test/vscode-linux-x64-1.136.1/bin/code
USER_DATA=$(mktemp -d /tmp/ovm-ud-XXXXXX)
EXT_DIR=$(mktemp -d /tmp/ovm-ex-XXXXXX)
RESULTS=/workspace/vscode-office/test-results
LOG=$RESULTS/gui-diagrams.log
mkdir -p "$RESULTS" "$USER_DATA/User"
cat > "$USER_DATA/User/settings.json" << 'JSON'
{
  "workbench.startupEditor": "none",
  "workbench.welcomePage.walkthroughs.openOnInstall": false,
  "chat.disableAIFeatures": true,
  "telemetry.telemetryLevel": "off",
  "window.restoreWindows": "none",
  "workbench.editorAssociations": {
    "*.md": "office-view-markdown.markdownViewer",
    "*.markdown": "office-view-markdown.markdownViewer"
  },
  "security.workspace.trust.enabled": false,
  "office-view-markdown.editMode": "wysiwyg",
  "office-view-markdown.mermaidTheme": "Light"
}
JSON
printf '%s\n' '{"enable-crash-reporter":false}' > "$USER_DATA/argv.json"
rm -f "$LOG" "$RESULTS"/mermaid-*.png "$RESULTS"/plantuml-*.png "$RESULTS"/diagrams-*.png
echo "USER_DATA=$USER_DATA" > "$LOG"
echo "EXT_DIR=$EXT_DIR" >> "$LOG"

shot() {
  local out="$1"
  ffmpeg -y -f x11grab -video_size 1600x900 -i "$DISPLAY" -update 1 -frames:v 1 "$out" >>"$LOG" 2>&1 || true
}

xvfb-run -a -s '-screen 0 1600x900x24' bash -c "
set -x
export DISPLAY
echo DISPLAY=\$DISPLAY >> '$LOG'
'$CODE_BIN' --user-data-dir='$USER_DATA' --extensions-dir='$EXT_DIR' \
  --disable-workspace-trust --skip-welcome --skip-release-notes \
  --extensionDevelopmentPath=/workspace/vscode-office \
  /workspace/vscode-office/test/markdown >>'$LOG' 2>&1 &
CPID=\$!
for i in \$(seq 1 45); do
  sleep 1
  if xdotool search --onlyvisible --class Code 2>/dev/null | head -1 | grep -q .; then
    echo win_at=\$i >>'$LOG'
    break
  fi
  if grep -q 'Loading development extension' '$LOG' 2>/dev/null; then
    echo loaded=\$i >>'$LOG'
  fi
done
sleep 2
WID=\$(xdotool search --onlyvisible --class Code | head -1 || true)
echo WID=\$WID >>'$LOG'
if [ -n \"\$WID\" ]; then
  xdotool windowactivate --sync \$WID || true
  xdotool key --window \$WID Escape; sleep 0.4
  xdotool key --window \$WID Escape; sleep 0.4
  xdotool mousemove --sync 980 560 click 1; sleep 0.6
  xdotool mousemove --sync 1050 620 click 1; sleep 0.6

  # Open Diagrams.md via quick open
  xdotool key --window \$WID ctrl+p; sleep 0.8
  xdotool type --delay 30 'Diagrams.md'; sleep 0.5
  xdotool key Return; sleep 3

  # Ensure custom editor
  xdotool key --window \$WID ctrl+shift+p; sleep 0.8
  xdotool type --delay 25 'View: Reopen Editor With'; sleep 0.6
  xdotool key Return; sleep 0.8
  xdotool type --delay 25 'Office View Markdown'; sleep 0.6
  xdotool key Return; sleep 5
fi

# Initial full view (should show Mermaid near top)
shot '$RESULTS/diagrams-open.png'
sleep 3
shot '$RESULTS/mermaid-render.png'

# Scroll down toward PlantUML sections
if [ -n \"\$WID\" ]; then
  xdotool windowactivate --sync \$WID || true
  xdotool mousemove --sync 900 500 click 1; sleep 0.3
  for n in 1 2 3 4 5 6 7 8; do
    xdotool key --window \$WID Next; sleep 0.25
  done
  sleep 4
fi
shot '$RESULTS/plantuml-render.png'

# Extra wait in case PlantUML images were slow
sleep 4
shot '$RESULTS/plantuml-render-2.png'

# Scroll back up for a second Mermaid evidence shot
if [ -n \"\$WID\" ]; then
  for n in 1 2 3 4 5 6 7 8; do
    xdotool key --window \$WID Prior; sleep 0.2
  done
  sleep 1
fi
shot '$RESULTS/mermaid-render-2.png'

kill \$CPID 2>/dev/null || true
sleep 1
kill -9 \$CPID 2>/dev/null || true
echo DONE >>'$LOG'
"
echo EXIT=$?
ls -la "$RESULTS"/mermaid-*.png "$RESULTS"/plantuml-*.png "$RESULTS"/diagrams-*.png 2>/dev/null || true
tail -40 "$LOG"
