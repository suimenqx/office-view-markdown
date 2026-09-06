#!/usr/bin/env bash
set -euo pipefail
USER_DATA="$1"
RESULTS="$2"
LOG="$3"
CODE_BIN="$4"
echo "DISPLAY=$DISPLAY" >> "$LOG"
shot() {
  local out="$1"
  ffmpeg -y -f x11grab -video_size 1600x900 -i "$DISPLAY" -update 1 -frames:v 1 "$out" >>"$LOG" 2>&1 || true
  ls -la "$out" >>"$LOG" 2>&1 || true
  echo "shot $out" >>"$LOG"
}
"$CODE_BIN" --user-data-dir="$USER_DATA" \
  --extensionDevelopmentPath=/home/box/.vscode/extensions/suimenqx.office-view-markdown-0.1.0 --disable-extensions --disable-workspace-trust --skip-welcome --skip-release-notes \
  --disable-gpu \
  /workspace/_shared/office-view-markdown/test/markdown/FailureHonestyAES.md >>"$LOG" 2>&1 &
CPID=$!
echo "CPID=$CPID" >>"$LOG"
for i in $(seq 1 60); do
  sleep 1
  if xdotool search --onlyvisible --class Code 2>/dev/null | head -1 | grep -q .; then
    echo "win_at=$i" >>"$LOG"
    break
  fi
done
sleep 10
WID=$(xdotool search --onlyvisible --class Code 2>/dev/null | head -1 || true)
echo "WID=$WID" >>"$LOG"
if [ -n "$WID" ]; then
  xdotool windowactivate --sync "$WID" || true
  xdotool key --window "$WID" Escape; sleep 0.3
  xdotool key --window "$WID" Escape; sleep 0.3
  xdotool key --window "$WID" ctrl+shift+p; sleep 1.0
  xdotool type --delay 18 'View: Reopen Editor With'; sleep 0.6
  xdotool key Return; sleep 0.9
  xdotool type --delay 18 'Office View Markdown'; sleep 0.6
  xdotool key Return; sleep 10
fi
shot "$RESULTS/aes-1-open-top.png"
sleep 2
shot "$RESULTS/aes-2-plantuml-unconfigured.png"
if [ -n "$WID" ]; then
  xdotool windowactivate --sync "$WID" || true
  xdotool mousemove --sync 900 500 click 1; sleep 0.3
  for n in 1 2 3 4 5 6; do
    xdotool key --window "$WID" Next; sleep 0.25
  done
  sleep 4
fi
shot "$RESULTS/aes-3-mermaid-fail.png"
if [ -n "$WID" ]; then
  for n in 1 2 3 4; do
    xdotool key --window "$WID" Next; sleep 0.25
  done
  sleep 4
fi
shot "$RESULTS/aes-4-broken-image.png"
if [ -n "$WID" ]; then
  for n in 1 2 3 4 5 6 7 8 9 10; do
    xdotool key --window "$WID" Prior; sleep 0.15
  done
  sleep 2
fi
shot "$RESULTS/aes-5-plantuml-top-again.png"
kill "$CPID" 2>/dev/null || true
sleep 1
kill -9 "$CPID" 2>/dev/null || true
echo DONE >>"$LOG"
