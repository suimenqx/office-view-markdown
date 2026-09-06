# 02: Scroll/caret restore — 滚位/光标可恢复

**What to build:** ADR 0008 invariant **滚位/光标可恢复**. Harden open-session restore on existing seams (`documentState`, `cacheFocus`, `restoreDocumentSession`). Apply `cacheFocus`-family anchors only after content is ready. Scroll position always restores per setting copy. When `office-view-markdown.restoreViewState` is on, restore caret/selection (prose path or CodeMirror block). When off, do not force caret/focus. Align host `config.get("restoreViewState", …)` fallback with package default `true`. Honor `pendingFragment` over stale session scroll.

**Blocked by:** Prefer land after or tightly with 01 so restore runs on the final chrome metrics, not a pre-font layout.

**Status:** done

**ui 观感：** 滚位/光标内容就绪后一次套上；恢复时勿闪大纲激活态。

- [x] Scroll restore on reopen (setting on or off) — after content ready
- [x] Caret/selection restore only when `restoreViewState` on (incl. CM block when saved as `type: "cm"`)
- [x] Host fallback matches contributed default `true`
- [x] Same-doc close/reopen in-session: stable repeatable restore
- [x] Unit coverage for restoreCaret true/false + scroll key round-trip; build green
