# 01: Paste round-trip fidelity + honest feedback

**What to build:** Clipboard paste (VS Code editor-data, HTML rich text, plain, image/folder failure) obeys ADR 0007 round-trip and parse≠mutation rules. Full success is silent; half-success shows one warning toast; hard failure shows error without dirtying the doc.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] VS Code editor-data paste silent and correct
- [x] Rich HTML degrade path inserts usable content + single warning toast (i18n)
- [x] Empty image / folder paste errors without dirty write
- [x] Fixtures cover HTML table with in-cell newlines surviving to export
- [x] Parse/format toggles do not rewrite paste source
