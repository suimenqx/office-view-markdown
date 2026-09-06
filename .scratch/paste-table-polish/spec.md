# Spec: Paste fidelity + table editing polish

Status: ready-for-agent

## Problem Statement

Users paste from the web/Office into Office View Markdown and lose structure (tables, in-cell newlines, rich text degraded without notice). Table editing feels unreliable when focus/selection jumps or multi-line cells misbehave. This undermines trust in the WYSIWYG document more than cosmetic chrome issues.

## Solution

Harden paste routing and table editing against three invariants (ADR 0007 (`docs/adr/0007-paste-fidelity-and-table-edit.md`)). Surface **half-success** paste with a single warning toast; keep full success silent. Add clear visual states for cell focus / row-col active / dragging without expanding into spreadsheet UI. Defer “open-doc visual stability” to a later wave.

## User Stories

1. As an author, I want paste from VS Code editor data to insert silently and correctly, so that daily coding paste stays frictionless.
2. As an author, I want paste from rich HTML that cannot be fully preserved to still insert usable Markdown/plain and tell me once that some formatting was dropped, so that I am not surprised later.
3. As an author, I want failed paste (empty image, folder) to error without dirtying the document.
4. As an author, I want in-cell newlines and table structure to survive paste and export round-trip.
5. As an author, I want parse/format toggles to not rewrite my pasted source.
6. As an author, I want entering a cell, editing multiple lines, and leaving the cell to keep a stable caret/selection.
7. As an author, I want the current cell/row/col to be visually obvious while editing or dragging rows/cols, without Excel-like chrome.

## Implementation Decisions

- Obey ADR 0007 (`docs/adr/0007-paste-fidelity-and-table-edit.md`) invariants.
- Toast: extend existing toast with `warning`; success path silent; copy via i18n; Design Token `--warning`.
- Tables: CSS/state classes for cell focus, row/col active, dragging; reuse existing table handle; no new selection UI surface.
- Prefer existing paste router seams (`routePasteClipboard` and related); highest testable seams for HTML/plain/table fixtures.
- No Welcome, auto side preview, LLM, remote fonts, second preview surface.

## Testing Decisions

- Unit/fixtures: paste HTML table with multiline cells → model + export retain newlines/structure.
- Unit: half-success path triggers warning toast once; full success no toast.
- Unit/DOM: focus/active/dragging classes apply as specified; hover does not override active.
- Build + existing unit suite pass; optional smoke fixture markdown with tables.

## Out of Scope

- Open-document flicker / font jump / scroll restore (wave 2)
- Spreadsheet features (formula bar, multi-range selection, row number gutter)
- Paste diagnostics panel / LLM explanation
- Forced version bump

## Further Notes

Studio consensus 2026-09-06. UI decisions: warning toast + table visual states (message from ui). Architect invariants captured in ADR 0007 (`docs/adr/0007-paste-fidelity-and-table-edit.md`) (refine if needed).

Canonical ADR: `docs/adr/0007-paste-fidelity-and-table-edit.md` (duplicate draft removed).
UI decisions locked 2026-09-06 (warning toast + table states).
