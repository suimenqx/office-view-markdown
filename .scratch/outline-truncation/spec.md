# Spec: Outline label truncation UX

Status: ready-for-agent

## Problem Statement

Users see only partial outline titles in the sidebar (e.g. “Images and inlin”) because labels use `white-space: nowrap` inside a narrow (~240px, shrinking) panel with overflow clipping / awkward horizontal scroll.

## Solution

Single-line ellipsis + hover full title; raise default Outline width (~280px); keep drag-resize and stored width (120–480). Stop relying on horizontal scroll / `max-content` list width as the way to read titles.

## User Stories

1. As a reader, I want truncated outline labels to end with an ellipsis, so that I know more text exists.
2. As a reader, I want to hover an outline item to see the full heading title, so that I can confirm the target before clicking.
3. As a reader, I want a slightly wider default Outline, so that common titles stay recognizable.
4. As a reader, I want to drag the Outline edge and have the width remembered, so that I can prefer less truncation.
5. As a reader, I do not want to horizontally scroll the outline list to read labels.

## Implementation Decisions

- Ellipsis on the label text node/span inside each outline item (`overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0` in the flex row).
- Set `title` (or existing tip pattern if already used for outline) to the full heading text on each item when rendered/updated.
- Default CSS width ~280px; adjust media breakpoints proportionally if they exist; keep resize handle + localStorage `outlineWidth`.
- Outline content list should fill panel width (not `width: max-content` forcing horizontal scroll for labels).
- Preserve existing active state, scroll-spy, collapse actions, i18n header.

## Testing Decisions

- Unit or DOM fixture: long label gets ellipsis styles / title attribute with full text.
- Manual/smoke: UxPolish outline shows ellipsis on long headings; hover shows full title.
- Build passes.

## Out of Scope

- Multi-line wrap as default
- Middle truncation
- New VS Code Settings key for outline width (local drag memory is enough)
- Notion-style hover-expand mini TOC
- Outline search/filter (Typora-style) in this pass

## Further Notes

Grill Round 1 accepted all recommendations. Research: `.scratch/outline-truncation-research.md`. ADR 0006.
