#!/usr/bin/env bash
set -euo pipefail
USER_DATA="$1"
RESULTS="$2"
LOG="$3"
CODE_BIN="$4"
EXT_PATH="$5"
FIXTURE_UX="$6"
FIXTURE_LONG="$7"
MD_DIR="$(dirname "$FIXTURE_UX")"
echo "DISPLAY=$DISPLAY" >> "$LOG"
echo "EXT_PATH=$EXT_PATH" >> "$LOG"
echo "MD_DIR=$MD_DIR" >> "$LOG"

shot() {
  local out="$1"
  ffmpeg -y -f x11grab -video_size 1600x900 -i "$DISPLAY" -update 1 -frames:v 1 "$out" >>"$LOG" 2>&1 || true
  ls -la "$out" >>"$LOG" 2>&1 || true
  echo "shot $out @$(date -Iseconds)" >>"$LOG"
}
burst() {
  local prefix="$1"; local n="$2"; local delay="$3"; local i
  for i in $(seq 1 "$n"); do
    shot "$RESULTS/${prefix}-f$(printf '%02d' "$i").png"
    sleep "$delay"
  done
}
force_ovm() {
  local wid="$1"
  xdotool windowactivate --sync "$wid" || true
  xdotool key --clearmodifiers Escape; sleep 0.3
  xdotool key --clearmodifiers Escape; sleep 0.3
  # Prefer Switch command (forge path)
  xdotool key --clearmodifiers ctrl+shift+p; sleep 1.2
  xdotool type --delay 18 'Office View Markdown: Switch Markdown Editor'; sleep 0.8
  xdotool key --clearmodifiers Return; sleep 2.5
  # Fallback Reopen With
  xdotool key --clearmodifiers ctrl+shift+p; sleep 1.2
  xdotool type --delay 18 'View: Reopen Editor With'; sleep 0.8
  xdotool key --clearmodifiers Return; sleep 1.0
  xdotool type --delay 18 'Office View Markdown'; sleep 0.8
  xdotool key --clearmodifiers Return; sleep 2.0
}
quick_open() {
  local wid="$1"; local name="$2"
  xdotool key --window "$wid" ctrl+p; sleep 0.9
  xdotool type --delay 20 "$name"; sleep 0.5
  xdotool key Return
}

# Open markdown fixture folder so quick-open works
"$CODE_BIN" --user-data-dir="$USER_DATA" \
  --extensionDevelopmentPath="$EXT_PATH" --disable-extensions --disable-workspace-trust \
  --skip-welcome --skip-release-notes --disable-gpu \
  "$MD_DIR" >>"$LOG" 2>&1 &
CPID=$!
echo "CPID=$CPID" >>"$LOG"

for i in $(seq 1 60); do
  sleep 1
  if xdotool search --onlyvisible --class Code 2>/dev/null | head -1 | grep -q .; then
    echo "win_at=$i" >>"$LOG"
    break
  fi
done
sleep 4
WID=$(xdotool search --onlyvisible --class Code 2>/dev/null | head -1 || true)
echo "WID=$WID" >>"$LOG"
if [ -z "$WID" ]; then echo NO_WINDOW >>"$LOG"; kill "$CPID" 2>/dev/null || true; exit 2; fi
xdotool windowactivate --sync "$WID" || true
xdotool key --window "$WID" Escape; sleep 0.3
xdotool key --window "$WID" Escape; sleep 0.3

# --- Phase A: UxPolish first paint ---
quick_open "$WID" "UxPolish.md"
sleep 2
force_ovm "$WID"
burst open-doc-firstpaint 16 0.28
sleep 2
shot "$RESULTS/open-doc-ux-settled.png"
shot "$RESULTS/open-doc-ux-ready.png"

# --- Phase B: LongOpen scroll + restore in SAME process ---
quick_open "$WID" "LongOpen.md"
sleep 2
force_ovm "$WID"
sleep 5
shot "$RESULTS/open-doc-long-top.png"
xdotool windowactivate --sync "$WID" || true
xdotool mousemove --sync 900 500 click 1; sleep 0.4
for n in $(seq 1 16); do xdotool key --window "$WID" Next; sleep 0.14; done
sleep 2
shot "$RESULTS/open-doc-long-mid.png"
xdotool mousemove --sync 920 540 click 1; sleep 0.35
shot "$RESULTS/open-doc-long-before-close.png"

# Close tab; reopen via quick open — associations should hit OVM cold-open with restore
xdotool key --window "$WID" ctrl+w; sleep 1.2
shot "$RESULTS/open-doc-after-close.png"
quick_open "$WID" "LongOpen.md"
# Capture restore settle WITHOUT forcing first (want real open path)
burst open-doc-restore 16 0.28
sleep 1
# If stock leaked through, force once and note in log
shot "$RESULTS/open-doc-long-restored.png"
# Outline click for active-state observation
xdotool mousemove --sync 130 360 click 1; sleep 0.5
shot "$RESULTS/open-doc-outline-after-restore.png"

# Dark theme quick check on UxPolish first paint (optional second open)
xdotool key --window "$WID" ctrl+k; sleep 0.2
xdotool key --window "$WID" ctrl+t; sleep 0.8
xdotool type --delay 12 'Dark Modern'; sleep 0.5
xdotool key Return; sleep 1
quick_open "$WID" "UxPolish.md"
sleep 1.5
force_ovm "$WID"
burst open-doc-dark 8 0.3
shot "$RESULTS/open-doc-ux-dark-settled.png"

kill "$CPID" 2>/dev/null || true
sleep 1
kill -9 "$CPID" 2>/dev/null || true
echo DONE >>"$LOG"
