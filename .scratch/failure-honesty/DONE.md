# Failure-honesty DONE

## Closed seams
- AES helper: optional `variant` (`info` | `warning` | `error`, default `warning`) + left accent CSS tokens for Light/Dark/HC.
- `sanitizeActionableErrorMessage`: first line, strip stack frames, truncate ~160, fallback body.
- PlantUML unconfigured → AES `info` + Open Settings (`onOpenPlantumlSettings`); never silent public host.
- PlantUML encode/url throw → AES `error` + Retry (sanitized body).
- PlantUML `<img>` network/load error → AES `error` + Retry (was silent broken-icon hole).
- Mermaid render catch → sanitized short body + Retry + `error` accent.
- Broken markdown image (`editorCommonEvent.markImageLoading`) → AES `error` + Retry (browser icon hidden).
- i18n: unconfigured title aligned (zh `未配置 …`); added Mermaid/PlantUML render-fail body keys in all locale packs.

## N/A / out of scope (inventory)
- Preview-only image paths beyond `editorCommonEvent` mutation observer: same `markImageLoading` covers inserted imgs; `preview/image.ts` lightbox is separate and not a silent render hole.
- Mermaid theme picker / chrome / outline / toast / welcome: not failure surfaces for this wave.
- Open-doc flicker / scroll restore: wave 2.
- No second empty-state system; no toast spam for these failures.

## Extra fix
- `markImageLoading` skips PlantUML render images (`isPlantumlRenderImage`) so diagram load failures use PlantUML AES only (no duplicate broken-image AES).
