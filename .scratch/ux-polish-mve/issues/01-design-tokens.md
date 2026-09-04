# 01: Design Tokens foundation

**What to build:** Shared Design Tokens (radius, shadow, transition, semantic success/warning/info/error colors derived from VS Code where possible) are available on the editor root and Auto theme, and existing chrome (toast, placeholders, code-block borders, tables) begins using them so surfaces feel like one product.

**Blocked by:** None (can start immediately)

**Status:** ready-for-human

- [x] Design Tokens are defined once and consumed by multiple chrome surfaces (no new one-off magic radii/shadows for those surfaces)
- [x] Semantic status colors map through VS Code-compatible tokens where practical
- [x] Auto / editor theme mapping does not break existing light/dark VS Code integration
- [x] Focused regression: editor still builds; existing unit tests still pass

## Comments

- Added shared radius, shadow, transition, and semantic status Design Tokens on the editor root with VS Code-backed Auto theme mappings.
- Wired toast, PlantUML placeholder/action, CodeMirror chrome, and table surfaces to the shared tokens.
- Verified with `node test/unit/plantumlServer.test.js` and `npm run build`.
