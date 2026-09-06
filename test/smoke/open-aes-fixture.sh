#!/usr/bin/env bash
# Open FailureHonestyAES.md in Office View Markdown custom editor (not stock Markdown).
# Usage:
#   ./test/smoke/open-aes-fixture.sh [path-to-vsix-or-extension-dir]
# Env:
#   CODE_BIN   default: code
#   FIXTURE    default: test/markdown/FailureHonestyAES.md
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CODE_BIN="${CODE_BIN:-code}"
FIXTURE="${FIXTURE:-$ROOT/test/markdown/FailureHonestyAES.md}"
EXT_ARG="${1:-}"

USER_DATA="$(mktemp -d /tmp/ovm-aes-open-XXXXXX)"
mkdir -p "$USER_DATA/User"
cat > "$USER_DATA/User/settings.json" << 'JSON'
{
  "workbench.startupEditor": "none",
  "workbench.welcomePage.walkthroughs.openOnInstall": false,
  "telemetry.telemetryLevel": "off",
  "window.restoreWindows": "none",
  "security.workspace.trust.enabled": false,
  "workbench.editorAssociations": {
    "*.md": "office-view-markdown.markdownViewer",
    "*.markdown": "office-view-markdown.markdownViewer"
  },
  "office-view-markdown.editMode": "wysiwyg",
  "office-view-markdown.plantuml.server": ""
}
JSON

ARGS=(
  --user-data-dir="$USER_DATA"
  --disable-workspace-trust
  --skip-welcome
  --skip-release-notes
)

if [[ -n "$EXT_ARG" ]]; then
  if [[ -d "$EXT_ARG" ]]; then
    ARGS+=(--extensionDevelopmentPath="$EXT_ARG" --disable-extensions)
  elif [[ -f "$EXT_ARG" ]]; then
    "$CODE_BIN" --install-extension "$EXT_ARG" --force
    echo "Installed $EXT_ARG — if host still shows stock Markdown, run Developer: Reload Window once, then re-run this script."
  else
    echo "Not a vsix or extension dir: $EXT_ARG" >&2
    exit 1
  fi
fi

echo "USER_DATA=$USER_DATA"
echo "viewType=office-view-markdown.markdownViewer"
echo "fallback: Command Palette → Office View Markdown: Switch Markdown Editor  (Ctrl+Alt+E / ⌃⌘E)"
echo "fallback: Command Palette → View: Reopen Editor With… → Office View Markdown"
exec "$CODE_BIN" "${ARGS[@]}" "$FIXTURE"
