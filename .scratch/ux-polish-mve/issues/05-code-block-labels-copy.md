# 05: Code-block labels & copy feedback

**What to build:** Code blocks show a human-readable language label and clear Copy → Copied feedback, while retaining existing code-block chrome power features.

**Blocked by:** 01 Design Tokens foundation

**Status:** done

- [x] Common languages display readable names (e.g. TypeScript, Shell)
- [x] Copy success feedback is visible then reverts
- [x] Existing chrome capabilities (language search / theme / expand where present) still work

**Comments:** Extended the existing code-block chrome to normalize common language IDs to readable labels such as TypeScript, Shell, JSX, and YAML. Copy now visibly changes its label and icon to Copied/check for 500ms before reverting, while preserving existing language search, theme, expand, and copy behavior. Verified with `node test/unit/codeBlockLanguageLabel.test.js` and `npm run build`.
