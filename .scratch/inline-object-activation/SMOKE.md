# SMOKE — inline-object activation (ADR 0012)

Acceptance surface: `office-view-markdown.markdownViewer` only. Open
`test/markdown/InlineObjectActivation.md` (or Home.md + any HTML island).

## Sequence

## Continuous GUI path (Light must-fix)

On `office-view-markdown.markdownViewer`, keep this as one uninterrupted GUI
sequence: plain-click an ordinary link, edit its text or destination, activate
Save with the existing popover action (Enter/Alt+Enter), and capture the next
frame. The popover is gone, the authored Markdown has one `linkHtml` undo/dirty
commit, and focus returns once to the link target through its ADR 0010 anchor —
not paragraph start, block top, or a surviving DOM node. Repeat the same
continuous plain-click → edit → Save → one refocus checklist for a wiki link,
image, and already-wired HTML island; capture a Light screenshot for the
ordinary-link path at minimum.

## Sequence

1. **Unified click grammar** — Plain-click an ordinary link, a wiki link, an
   image, and an HTML island. Each opens its edit affordance (popover). None
   require a different gesture (e.g. wiki-only double-click) to edit.
2. **Modifier visible** — Cmd/Ctrl+Click the same objects. Expect host-open /
   navigate **without** a flash of the edit ring/popover first. Plain click
   still shows the edit affordance.
3. **Ordinary link edit + undo** — Edit href/text, Save. Expect one ADR 0009
   undo unit (`linkHtml`). Ctrl/Cmd+Z restores prior Markdown once. Focus
   returns to the link once (not paragraph start).
4. **Wiki host-open + edit** — Cmd/Ctrl+Click opens via `wiki:` host path from
   the shared target. Plain click opens wiki popover (display/path/fragment);
   Save is one undo unit; focus returns to the wiki object once.
5. **HTML source popover** — Alt+Enter or plain click opens source popover.
   Save commits one ADR 0009 tx; enclosing selection/focus restores via ADR
   0010 (selection must not disappear). Cancel likewise returns once.
6. **Image** — Plain click opens image edit fields under the same target model;
   does **not** select all surrounding prose. Cmd/Ctrl+Click opens destination
   without edit flash.
7. **Link-reference** — Same contract as ordinary link for edit + focus return.

## UI 观感 (Studio locked `4b6d565`)

- 点击语法统一 · 修饰键可见 · 回焦一次

## Residual risks

- Wiki popover edits DOM display/source/`data-href` then commits; Lute
  re-render may reshuffle child nodes — focus return uses ADR 0010 identity,
  not surviving DOM nodes.
- IR mode wiki/HTML parity is best-effort; acceptance is `markdownViewer`
  WYSIWYG first.
- Host `onLinkClick` still accepts legacy payloads without `target` for
  footnote/tag paths.
- Async diagram generation guards remain backlog (pain #5).
