# 03: Retry + AES unchanged + no undo / focus steal

**What to build:** ADR 0013 Retry and lifecycle constraints. Retry on AES failure **re-reads current source** (and current renderer/theme config) at click time—never a closed-over snapshot from the first failure. Keep **ADR 0003** AES contract unchanged: same Actionable Empty State family, Open Settings when unconfigured, Retry when configured render/image fails; no new empty-state panel, no toast spam, no silent probing, no default public PlantUML server. Render commit, dispose, loading chrome, and Retry must **not** invent ADR 0009 undo/dirty units and must **not** steal ADR 0010 focus anchors. Do not reopen FindBar / inline-object / Welcome / LLM.

**Blocked by:** Prefer land with or after 01 (guard) and alongside 02 (paths that own Retry).

**Status:** ready-for-agent

**ui 观感：** 不抢焦点锚；不进 undo；AES 不变。

- [ ] Retry re-reads current source + current theme/config (not closed-over snapshot)
- [ ] AES contract unchanged (ADR 0003): Open Settings / Retry family and copy
- [ ] No default public PlantUML server / silent probing (ADRs 0001–0002)
- [ ] Render commit / dispose / Retry invent no ADR 0009 undo/dirty
- [ ] Render transitions do not steal ADR 0010 focus anchors
- [ ] Unit + SMOKE: Retry-after-edit uses new source; AES still actionable; build green

## Comments
