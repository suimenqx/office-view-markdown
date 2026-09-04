# Spec: UX polish review follow-ups (tickets 04–10)

Status: ready-for-agent

## Problem Statement

Code review of the MVE-inspired polish pass (`d4c0007...HEAD`) found Spec gaps (chips hiding multi-values, missing table wrapper clipping, over-eager figure wrapping / figcaption, incomplete alert smoke) and Standards debt (duplicated Md→DOM and alert-scope wiring, over-broad generated-node cleanup). Users can see incomplete tables/images/frontmatter; maintainers will pay duplication cost on the next presentation change.

## Solution

Ship a small follow-up: fix Spec hard issues first, then extract shared after-render hooks and narrow cleanup APIs. Expand the smoke fixture to cover all GitHub Alert types. No new product surface beyond what the original polish spec already asked for.

## User Stories

1. As a notes user in chips Frontmatter Presentation, I want every short list value (e.g. tags) visible, so that compact mode does not hide authored metadata.
2. As a reader, I want tables with a real wrapper that clips rounded corners reliably, so that table chrome matches the polish spec.
3. As an editor, I want images to gain figure/figcaption only when caption is warranted, without breaking paragraph structure in WYSIWYG.
4. As a maintainer, I want the UX polish smoke Markdown to exercise NOTE/TIP/WARNING/CAUTION/IMPORTANT, so that alert styling regressions are caught.
5. As a maintainer, I want one shared after-Lute-HTML / alert-refresh path instead of duplicated IR+WYSIWYG+mount sites, so that the next presentation mode does not shotgun-edit.
6. As a developer, I want `removeActionableEmptyState` (or a renamed API) to remove only empty-state cards, so that other generated chrome is not wiped by accident.

## Implementation Decisions

- Feature dir: `.scratch/ux-polish-mve-review-fixes/`
- Prefer Spec fixes (chips, table wrapper, image figure policy, smoke) before Standards refactors
- Keep ADR-0005: alerts remain presentation-only
- Keep ADR-0003: Actionable Empty State contract unchanged except cleanup scope
- No Welcome / side preview / web fonts / version bump required

## Testing Decisions

- Unit tests for chips multi-value visibility / frontmatter presentation helper if pure
- Unit or DOM fixture for table wrapper class presence
- Image helper: only wrap when caption warrants; strip/export still clean
- Smoke fixture lists all five alert types
- Existing unit suite + build must pass after refactor tickets

## Out of Scope

- Re-opening 01–03 design
- New Callout toolbar
- Full pixel snapshot suite
- Forced Marketplace version bump

## Further Notes

Source reviews: `.scratch/ux-polish-mve/reviews/04-10-{standards,spec,summary}.md`
