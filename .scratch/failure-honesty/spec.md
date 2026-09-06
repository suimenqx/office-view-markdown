# Spec: Failure-state honesty (Actionable Empty State alignment)

Status: ready-for-agent

## Problem Statement

When images or diagram renders fail (or PlantUML is unconfigured), users must never see a silent hole or a browser broken-image icon as the only feedback. Trust is the product edge: failure must be honest and the next step clickable.

## Solution

Align all media/diagram failure paths to the existing Actionable Empty State family per expanded ADR 0003 and ui’s three-row matrix (unconfigured → Open Settings; render fail → Retry; broken image → Retry). Polish copy, accent variants, and any remaining silent paths. No new panel. Open-doc stability remains wave 2.

## User Stories

1. As an author with Unconfigured PlantUML Server, I want an AES card that says source is not sent anywhere and offers Open Settings.
2. As an author whose Mermaid or configured PlantUML render fails, I want an AES card with a short readable reason and Retry.
3. As an author whose image fails to load, I want an AES card (not a broken-image icon alone) with Retry after checking the path.
4. As an author, I want these three scenes to feel like one component family across Light/Dark(/HC).
5. As an author, I want the underlying source block to remain editable while the AES is shown.

## Implementation Decisions

- Obey ADR 0003 (expanded). Follow ui matrix for title/body/CTA; i18n all strings.
- Reuse `vditor-actionable-empty-state`; optional info vs warning/error left accent only.
- Use forge inventory `.scratch/silent-failure-inventory/NOTES.md` to find remaining silent paths; do not invent a second empty-state system.
- Host Open Settings continues existing plantuml settings deep-link pattern.

## Testing Decisions

- Unit: AES helper variants / copy keys if pure; image/mermaid/plantuml failure seams trigger AES with correct CTA.
- Build + unit suite pass; optional smoke on Diagrams.md + broken image fixture.

## Out of Scope

- Open-doc flicker / scroll restore (wave 2)
- New diagnostics panel, Welcome empty, toast spam for every failure
- Spreadsheet or LLM features

## Further Notes

Studio 2026-09-06: product priority failure honesty → open-doc stability. ui matrix locked. Architect ADR 0003 expanded `a16a246`. Paste/table wave already on main `0ca1714`.
