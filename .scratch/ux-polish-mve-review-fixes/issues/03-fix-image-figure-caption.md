# 03: Image figure / figcaption policy

**What to build:** Apply radius/border/shadow polish without always wrapping every image in `<figure>`. Add figcaption only when alt/title warrants it (not every non-empty decorative alt). Avoid injecting `<figure>` inside `<p>` in ways that split paragraphs and break WYSIWYG editing/insert paths. Export/strip presentation remains clean.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Images are not unconditionally wrapped in generated `<figure>` when no caption is warranted
- [ ] Figcaption appears only when caption is warranted (clear heuristic documented in code comment or helper name)
- [ ] No figure-inside-paragraph structural breakage in WYSIWYG
- [ ] Insert/edit image paths still work; presentation strip on export/clone still works
