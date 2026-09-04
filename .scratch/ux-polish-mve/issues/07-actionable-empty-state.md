# 07: Actionable Empty State + host helper

**What to build:** Unconfigured PlantUML Server, PlantUML/Mermaid render failures, and image load failures share one Actionable Empty State pattern (title, secondary text, primary Open Settings or Retry). Host-side failures use the same contract via an actionable warning helper. No Welcome screen.

**Blocked by:** 01 Design Tokens foundation

**Status:** done

- [x] PlantUML unconfigured / render failure uses Actionable Empty State
- [x] Mermaid and image failures align to the same visual/language pattern
- [x] Host helper offers Open Settings (or equivalent) on configuration failures
- [x] No full-page Welcome introduced (ADR 0003 / 0004)

**Comments:** Added one Actionable Empty State renderer with title, body, and primary action styling. PlantUML uses Open Settings for missing configuration and Retry for render failures; Mermaid failures use Retry; image load failures use Retry while keeping the source-bearing image in the DOM. Generated state nodes and temporary image error styles are removed from Markdown export clones. Added localized labels across the bundled Vditor locales and retained the existing host-side Open Settings warning helper. Verified with `node test/unit/plantumlServer.test.js` and `npm run build`.
