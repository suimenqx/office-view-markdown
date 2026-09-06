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

dismiss_chrome() {
  local wid="$1"
  xdotool windowactivate --sync "$wid" || true
  # Toggle chat closed (starts open on this host); Escape clears overlays
  xdotool key --window "$wid" --clearmodifiers ctrl+alt+i; sleep 0.35
  xdotool key --window "$wid" --clearmodifiers Escape; sleep 0.2
  xdotool key --window "$wid" --clearmodifiers Escape; sleep 0.2
  xdotool mousemove --sync 850 450 click 1; sleep 0.3
}

dismiss_save() {
  local wid="$1"
  # Prefer mouse hit on Don't Save (Alt+N unreliable on this host)
  # Dialog is centered on 1600x900; Don't Save is leftmost button
  xdotool mousemove --sync 710 505 click 1; sleep 0.45
  xdotool mousemove --sync 690 495 click 1; sleep 0.35
  xdotool key --window "$wid" --clearmodifiers alt+n; sleep 0.3
  xdotool key --window "$wid" --clearmodifiers Left Left; sleep 0.15
  xdotool key --window "$wid" --clearmodifiers Return; sleep 0.35
  xdotool key --window "$wid" --clearmodifiers Escape; sleep 0.2
}

# CRITICAL: must select "View: Reopen Editor With..." (picker), NOT
# "View: Reopen Editor with Text Editor" (that switches OVM → stock).
force_ovm() {
  local wid="$1"
  local tag="${2:-ovm}"
  dismiss_chrome "$wid"

  # --- Palette: uniquify to With... picker (ellipsis) ---
  xdotool key --window "$wid" --clearmodifiers ctrl+shift+p; sleep 1.2
  # Type fragment that prefers the ellipsis picker over "with Text Editor"
  xdotool type --delay 18 'Reopen Editor With...'; sleep 1.0
  shot "$RESULTS/open-doc-${tag}-palette.png"
  xdotool key --window "$wid" --clearmodifiers Return; sleep 1.2
  shot "$RESULTS/open-doc-${tag}-picker.png"
  xdotool type --delay 18 'Office View Markdown'; sleep 0.9
  shot "$RESULTS/open-doc-${tag}-picker2.png"
  xdotool key --window "$wid" --clearmodifiers Return; sleep 8.0
  shot "$RESULTS/open-doc-${tag}-after-reopen.png"

  # Second palette pass (still With... picker only — never "with Text Editor")
  dismiss_chrome "$wid"
  xdotool key --window "$wid" --clearmodifiers ctrl+shift+p; sleep 1.0
  xdotool type --delay 18 'Reopen Editor With...'; sleep 0.9
  xdotool key --window "$wid" --clearmodifiers Return; sleep 1.0
  xdotool type --delay 18 'Office View Markdown'; sleep 0.8
  xdotool key --window "$wid" --clearmodifiers Return; sleep 8.0
  shot "$RESULTS/open-doc-${tag}-after-reopen2.png"
}

quick_open() {
  local wid="$1"; local name="$2"
  dismiss_chrome "$wid"
  xdotool key --window "$wid" --clearmodifiers ctrl+p; sleep 1.0
  xdotool type --delay 25 "$name"; sleep 0.6
  xdotool key --window "$wid" --clearmodifiers Return
}

revert_file() {
  local wid="$1"
  dismiss_chrome "$wid"
  xdotool key --window "$wid" --clearmodifiers ctrl+shift+p; sleep 1.0
  xdotool type --delay 18 'File: Revert File'; sleep 0.8
  xdotool key --window "$wid" --clearmodifiers Return; sleep 0.8
  # Confirm "Are you sure you want to revert..." → Revert
  xdotool key --window "$wid" --clearmodifiers alt+r; sleep 0.3
  xdotool key --window "$wid" --clearmodifiers Return; sleep 0.5
  # Mouse fallback on confirm Revert button (dialog center-bottom)
  xdotool mousemove --sync 820 500 click 1; sleep 0.5
  xdotool key --window "$wid" --clearmodifiers Escape; sleep 0.2
}

close_tab_clean() {
  local wid="$1"
  dismiss_chrome "$wid"
  xdotool key --window "$wid" --clearmodifiers ctrl+w; sleep 1.0
  dismiss_save "$wid"
}

close_all_editors() {
  local wid="$1"
  dismiss_chrome "$wid"
  xdotool key --window "$wid" --clearmodifiers ctrl+shift+p; sleep 1.0
  xdotool type --delay 18 'View: Close All Editors'; sleep 0.8
  xdotool key --window "$wid" --clearmodifiers Return; sleep 1.0
  dismiss_save "$wid"
  dismiss_save "$wid"
  sleep 0.5
}

click_webview() {
  local wid="$1"
  xdotool windowactivate --sync "$wid" || true
  xdotool mousemove --sync 900 500 click 1; sleep 0.45
  xdotool mousemove --sync 920 540 click 1; sleep 0.35
}

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
sleep 5
WID=$(xdotool search --onlyvisible --class Code 2>/dev/null | head -1 || true)
echo "WID=$WID" >>"$LOG"
if [ -z "$WID" ]; then echo NO_WINDOW >>"$LOG"; kill "$CPID" 2>/dev/null || true; exit 2; fi
xdotool windowactivate --sync "$WID" || true
dismiss_chrome "$WID"
sleep 1

# --- Phase A: UxPolish first paint ---
quick_open "$WID" "UxPolish.md"
sleep 3
force_ovm "$WID" "ux"
burst open-doc-firstpaint 16 0.28
sleep 2
shot "$RESULTS/open-doc-ux-settled.png"
shot "$RESULTS/open-doc-ux-ready.png"

# Close ALL editors so Phase B has ONLY LongOpen
revert_file "$WID"
close_all_editors "$WID"
sleep 0.8
shot "$RESULTS/open-doc-after-ux-close.png"

# --- Phase B: LongOpen — FORCE OVM BEFORE deep scroll ---
quick_open "$WID" "LongOpen.md"
sleep 3
force_ovm "$WID" "long"
sleep 3
shot "$RESULTS/open-doc-long-top.png"
click_webview "$WID"
for n in $(seq 1 16); do xdotool key --window "$WID" --clearmodifiers Next; sleep 0.14; done
sleep 2
shot "$RESULTS/open-doc-long-mid.png"
click_webview "$WID"
shot "$RESULTS/open-doc-long-before-close.png"

# Clean close (no Save dialog) then reopen same LongOpen for restore
revert_file "$WID"
sleep 0.8
shot "$RESULTS/open-doc-long-after-revert.png"
close_tab_clean "$WID"
sleep 0.8
dismiss_save "$WID"
dismiss_save "$WID"
sleep 1.0
shot "$RESULTS/open-doc-after-close.png"

quick_open "$WID" "LongOpen.md"
burst open-doc-restore 16 0.28
sleep 1
shot "$RESULTS/open-doc-long-restored.png"
xdotool mousemove --sync 130 360 click 1; sleep 0.5
shot "$RESULTS/open-doc-outline-after-restore.png"

# Dark theme on UxPolish — ONLY after restore shots
xdotool key --window "$WID" --clearmodifiers ctrl+k; sleep 0.25
xdotool key --window "$WID" --clearmodifiers ctrl+t; sleep 0.9
xdotool type --delay 15 'Dark Modern'; sleep 0.5
xdotool key --window "$WID" --clearmodifiers Return; sleep 1
quick_open "$WID" "UxPolish.md"
sleep 2
force_ovm "$WID" "dark"
burst open-doc-dark 8 0.3
shot "$RESULTS/open-doc-ux-dark-settled.png"

kill "$CPID" 2>/dev/null || true
sleep 1
kill -9 "$CPID" 2>/dev/null || true
echo DONE >>"$LOG"
