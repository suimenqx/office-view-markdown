# SMOKE — async-render generation (ADR 0013)

Acceptance surface: `office-view-markdown.markdownViewer` only. Open
`test/markdown/AsyncRenderGeneration.md` (or `Diagrams.md` +
`FailureHonestyAES.md`). Do not use the stock Markdown preview/editor.

## Sequence

1. **Edit during Mermaid render** — Open a Mermaid block, quickly edit the
   source while a slow theme/script path could still be in flight (or throttle
   network in DevTools). Expect: no flash of the prior SVG; loading then the
   **new** diagram only. Stale SVG/AES must not overwrite the edited block.
2. **Theme switch mid-flight** — With Mermaid visible, change Mermaid theme
   (or editor theme that refreshes Mermaid) while a render is pending. Expect:
   only the result matching the **current** theme commits; no cross-theme flash.
3. **PlantUML edit / supersede** — With PlantUML Server configured, edit a
   PlantUML fence while encode/img is pending. Expect: stale img/error does not
   write; final chrome matches current source.
4. **Retry after edit** — Force Mermaid AES (invalid syntax) → fix syntax in the
   block → click **Retry**. Expect: Retry uses the **edited** source (success
   diagram), not the closed-over first-failure snapshot. Same for broken image
   Retry after changing `src`.
5. **AES unchanged (ADR 0003)** — Unconfigured PlantUML still shows AES `info` +
   **Open Settings**. Configured PlantUML/Mermaid/image failures still show AES
   `error` + **Retry**. No toast spam, no silent public PlantUML probe.
6. **No undo / no focus steal** — While caret is in prose, let an async diagram
   complete or click Retry on a diagram AES. Expect: caret/selection stay put
   (ADR 0010); Ctrl/Cmd+Z does not undo the render/Retry (ADR 0009).

## UI 观感 (Studio locked `ff88e15`)

1. **三态互斥**：loading / ready / error 同时只见一种；切换不叠旧图与 AES。
2. **过期不闪**：源已改或世代过期时，陈旧 SVG/img/error 不得闪一下再被替换。
3. **不抢焦点锚**：异步完成不抢 ADR 0010 焦点锚；不进 undo（ADR 0009）。

## Residual risks

- Special-block CM preview resets `data-mermaid` / `data-plantuml` on remount;
  generation identity is per host element and survives only while the host node
  stays connected.
- PlantUML Retry re-enters `plantumlRender` on the mode root (same as ADR 0003
  path) and re-reads `data-plantuml` preferentially so AES chrome textContent is
  not mistaken for diagram source.
- Image generation keys on `src` string; cache-busting identical URLs still share
  revision until Retry clears/reassigns `src`.
- Full VS Code screenshot CI is not required for this wave.
