# 03: Wiki / HTML parity under same contract

**What to build:** ADR 0012 wiki and raw-HTML parity on the shared document-target. Wiki path/fragment resolution and host-open (`wiki:`) use the same target object as ordinary links—provider open is an action on the target, not a parallel click grammar. Link-reference edits land on the same contract. Raw HTML may remain an explicit source popover, but save is one **ADR 0009** semantic transaction that preserves enclosing document position via **ADR 0010**. Do not broaden raw HTML into full arbitrary-DOM authoring or add a second preview surface.

**Blocked by:** Prefer land with or after 01 (shared target) and alongside 02 (same activation/edit/focus-return paths).

**Status:** ready-for-agent

**ui 观感：** provisional — wiki/HTML 不另开交互方言；HTML save 后焦点落稳同 link。

- [ ] Wiki host-open + path/fragment edit use document-target (same contract as ordinary link)
- [ ] Link-reference edits use the same contract
- [ ] HTML source popover save: one ADR 0009 tx; enclosing position via ADR 0010
- [ ] No second preview / full arbitrary-DOM HTML authoring / new Markdown semantics
- [ ] Unit + SMOKE: wiki open/edit + HTML save/undo/position; build green
