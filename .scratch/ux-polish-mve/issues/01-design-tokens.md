# 01: Design Tokens foundation

**What to build:** Shared Design Tokens (radius, shadow, transition, semantic success/warning/info/error colors derived from VS Code where possible) are available on the editor root and Auto theme, and existing chrome (toast, placeholders, code-block borders, tables) begins using them so surfaces feel like one product.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Design Tokens are defined once and consumed by multiple chrome surfaces (no new one-off magic radii/shadows for those surfaces)
- [ ] Semantic status colors map through VS Code-compatible tokens where practical
- [ ] Auto / editor theme mapping does not break existing light/dark VS Code integration
- [ ] Focused regression: editor still builds; existing unit tests still pass
