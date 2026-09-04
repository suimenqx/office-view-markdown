# 08: Tables, tasks, images polish

**What to build:** Tables get rounded clipping, clearer header emphasis, and row hover. Task lists get styled checkboxes that still toggle in WYSIWYG. Images get light radius/border/shadow and figcaption when alt/title warrants it.

**Blocked by:** 01 Design Tokens foundation

**Status:** done

- [x] Table polish uses Design Tokens and does not break table editing
- [x] Task checkbox styling still toggles task state in WYSIWYG
- [x] Image chrome + figcaption when appropriate; editing/insert paths still work

**Comments:** Added token-backed table shadow/row hover and preserved table structure/editing behavior. Task checkboxes now use native checkbox semantics with themed accent color, so existing WYSIWYG toggling remains intact. Images receive light border/radius/shadow treatment; images with useful alt/title text gain a generated figcaption, while export clones unwrap that presentation and retain plain Markdown image source. Verified with `node test/unit/imageFigure.test.js` and `npm run build`.
