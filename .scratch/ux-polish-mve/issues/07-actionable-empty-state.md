# 07: Actionable Empty State + host helper

**What to build:** Unconfigured PlantUML Server, PlantUML/Mermaid render failures, and image load failures share one Actionable Empty State pattern (title, secondary text, primary Open Settings or Retry). Host-side failures use the same contract via an actionable warning helper. No Welcome screen.

**Blocked by:** 01 Design Tokens foundation

**Status:** ready-for-agent

- [ ] PlantUML unconfigured / render failure uses Actionable Empty State
- [ ] Mermaid and image failures align to the same visual/language pattern
- [ ] Host helper offers Open Settings (or equivalent) on configuration failures
- [ ] No full-page Welcome introduced (ADR 0003 / 0004)
