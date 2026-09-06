# CONTEXT — semantic-edit-tx

**Transaction** = one user intent → one canonical Markdown commit + one undo unit + one dirty/save. **Presentation-only** (remount, lazy CM, diagram refresh, chrome) never enters history. **Focus ≠ history owner.** Surface under test: `office-view-markdown.markdownViewer` only. Consumers later: FindBar, async render generation; related later: in-session caret continuity (pain #2).
