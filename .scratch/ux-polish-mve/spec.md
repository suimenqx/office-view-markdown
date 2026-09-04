# Spec: Reading Surface & chrome polish (MVE-inspired)

Status: ready-for-agent

## Problem Statement

Users opening Markdown in Office View Markdown experience a capable WYSIWYG editor, but the Reading Surface and surrounding chrome still feel uneven: radii/shadows/status colors are scattered, type size and heading hierarchy are less “published,” outline active state is easy to miss, GitHub Alerts look like plain quotes, code-block and frontmatter chrome are powerful but not always scannable, empty/error paths are inconsistent, and Marketplace packaging under-signals a serious product. Competitors show stronger reading aesthetics without matching OVM’s edit-in-place model; users should get that polish without losing WYSIWYG.

## Solution

Apply a coordinated Reading Surface and chrome polish pass inside the existing custom editor: shared Design Tokens; configurable Editor Font Size (VS Code Settings + in-editor settings panel) with native VS Code fonts; stronger heading/outline/TOC visuals; presentation-only GitHub Alerts; clearer code-block language labels and copy feedback; optional Frontmatter Presentation chips alongside the editable table; unified Actionable Empty States for diagram/config failures; Marketplace `galleryBanner` and command category polish; table/task/image and light micro-interaction upgrades. Explicitly out of scope: second preview surface, Welcome app, LLM keys, remote web fonts.

## User Stories

1. As a writer, I want the editor chrome to share one set of Design Tokens (radius, shadow, transition, semantic status colors), so that toasts, placeholders, code blocks, and tables feel like one product.
2. As a reader-editor, I want a comfortable Reading Surface measure and line height on wide screens, so that long documents do not stretch unreadably.
3. As a reader-editor, I want heading hierarchy with clearer visual weight (e.g. h1/h2 separation, quieter h5/h6), so that structure is obvious while scrolling.
4. As a user, I want to change Editor Font Size from VS Code Settings, so that size survives across sessions and machines via Settings Sync.
5. As a user, I want to change Editor Font Size from the in-editor settings panel with a stepper (12–28, step 2), so that I can adjust without leaving the document.
6. As a user, I want the default Editor Font Size to follow the VS Code editor font size until I override it, so that the extension feels native.
7. As a user, I want typography to use the VS Code editor font family (no remote or bundled web fonts), so that privacy, offline use, and native look are preserved.
8. As a navigator, I want the outline header to read as “本页目录” (and other locales), so that the TOC matches reading-app information architecture.
9. As a navigator, I want the active outline item to show a left accent bar and light background, so that I can see where I am on the page.
10. As a navigator, I want existing outline collapse and narrow-screen behavior preserved, so that polish does not regress mobile/layout modes.
11. As a navigator, I want heading `scroll-margin-top` aligned with the existing outline scroll offset, so that titles are not hidden under chrome when jumped to.
12. As a navigator, I do not want default smooth scrolling on outline clicks, so that motion matches typical VS Code behavior.
13. As an author of GitHub-flavored docs, I want `[!NOTE|TIP|WARNING|CAUTION|IMPORTANT]` blockquotes styled as GitHub Alerts, so that callouts are recognizable.
14. As an author, I want alert styling to preserve my Markdown source on edit round-trip, so that I do not get silent rewrites.
15. As an author, I want ordinary blockquotes unchanged, so that non-alert quotes keep current VS Code quote styling.
16. As a reader, I want code blocks to show a human-readable language label (e.g. TypeScript, Shell), so that I can scan languages without decoding short ids.
17. As a reader, I want Copy on a code block to show clear Copied feedback, so that I know the action succeeded.
18. As an editor, I want existing code-block chrome capabilities (language search/theme/expand where present) retained, so that polish does not remove power tools.
19. As a notes user, I want Frontmatter Presentation defaulting to the editable table, so that Properties remain first-class.
20. As a notes user, I want an optional chips mode for short frontmatter, so that light metadata does not dominate the Reading Surface.
21. As a notes user, I want chip icons to use Codicon, so that icons match VS Code chrome across OS installs.
22. As a user with Unconfigured PlantUML Server, I want an Actionable Empty State with Open Settings, so that I know how to enable diagrams.
23. As a user whose PlantUML or Mermaid render fails, I want the same Actionable Empty State pattern (Retry and/or Open Settings as appropriate), so that errors are consistent.
24. As a user whose image fails to load, I want a consistent failure card, so that broken media is not a silent hole.
25. As a user hitting host-side configuration problems, I want `showWarningMessage` with Open Settings, so that deep-links match in-editor empty states.
26. As a Marketplace browser, I want a dark `galleryBanner`, so that the extension looks intentional in the store.
27. As a command palette user, I want commands categorized under “Office View Markdown”, so that related actions group together.
28. As a settings user, I want new settings to use `markdownDescription` and sensible `order`, so that Settings UI stays as clear as PlantUML Server Base URL.
29. As a reader, I want tables with rounded clipping, clearer header emphasis, and row hover, so that tables feel finished.
30. As a task-list user, I want custom-styled checkboxes that still toggle task state in WYSIWYG, so that aesthetics do not break editing.
31. As a reader, I want images with light radius/border/shadow and figcaption when alt/title warrants it, so that figures feel deliberate.
32. As a reader, I want links to show a subtle underline on hover, so that affordance is clear without clutter.
33. As a reader, I want inline code with slight border/emphasis using existing tokens, so that code chips match the Design Tokens system.
34. As a reader, I want horizontal rules to use a thin token color, so that separators are quiet.
35. As a developer extending external features later, I want the Actionable Empty State / Open Settings contract documented (ADR), so that new dependencies do not invent one-off failure UX.
36. As a maintainer, I want this work under `.scratch/ux-polish-mve/` with agent-ready tickets, so that implementation can proceed ticket-by-ticket.
37. As a maintainer, I want build + host smoke on a sample Markdown (alerts, tables, tasks, code, TOC, PlantUML unconfigured) without mandatory pixel snapshots, so that acceptance stays practical.
38. As a maintainer, I want version bump to remain optional after implementation, so that shipping cadence stays a separate decision.
39. As a Chinese-locale user, I want new UI strings localized (including outline header), so that chrome is not English-only.
40. As a user, I want polish never to auto-open a side preview or Welcome screen, so that opening a `.md` file stays “document first.”

## Implementation Decisions

- Feature directory: `.scratch/ux-polish-mve/` (this spec + numbered issue files).
- Apply Design Tokens on the editor CSS root and Auto theme mapping; gradually replace magic numbers in toast, plantuml placeholder, codemirror chrome, and reset styles.
- Editor Font Size: contribute `office-view-markdown.editorFontSize`; mirror control in the existing in-editor settings panel stepper (12–28, step 2); default follows VS Code editor font size until overridden; write through to a CSS variable on the Reading Surface.
- Do not add a hard-coded 820px-only measure setting; strengthen use of existing page-width behavior for a clear measure on wide screens.
- Outline: visual active state + i18n header; keep scroll offset algorithm; add `scroll-margin-top` on headings; no default smooth scroll.
- GitHub Alerts: detect markers and add semantic classes only; no source rewrite; no Callout block type/toolbar in this effort (ADR 0005).
- Code blocks: extend human-readable language labels and copy success feedback on existing chrome.
- Frontmatter Presentation: setting `table | chips`, default `table`; chips use Codicon.
- Actionable Empty State: shared visual/language for Unconfigured PlantUML Server, PlantUML/Mermaid/image failures; host helper for actionable warnings (ADR 0003).
- Marketplace: dark `galleryBanner` (~`#0d1117`); command category “Office View Markdown”; no speculative category sprawl.
- Content blocks: table wrapper radius/header/hover; task checkbox styling without breaking toggle; image radius/border/shadow + figcaption when appropriate; link hover underline; inline code border; quiet `hr`.
- Respect ADRs 0001–0002 (PlantUML privacy/shape) and 0003–0005 (this effort).
- Do not invent false upstream license claims; keep NOTICE/README attribution intact.

## Testing Decisions

- Good tests assert external behavior (settings → CSS variable / contributed config; alert marker → class mapping pure function; host actionable warning offers Open Settings), not private CSS structure.
- Prefer existing unit-test patterns in the repo; add focused tests at those seams.
- Visual acceptance via package + install + smoke on a sample Markdown covering alerts, TOC active state, tables/tasks/images, code-block copy label, frontmatter modes, and PlantUML unconfigured empty state.
- No mandatory pixel/screenshot golden tests in this effort.

## Out of Scope

- Full-page Welcome / marketing feature grid
- Auto-open side preview or any second Reading Surface
- LLM rewrite, API keys, multi-provider AI UI
- Remote or bundled web fonts (Inter, JetBrains Mono, Google Fonts, etc.)
- Electron desktop file browser patterns from the reference app
- PlantUML server authentication (already permanently out of scope)
- Forced Marketplace version bump as part of this spec
- New Callout block type / toolbar inserter beyond presentation-only GitHub Alerts
- Replacing WYSIWYG with a preview-only architecture

## Further Notes

- Primary analysis source: `docs/analysis/compare-markdown-viewer-enhanced.md`.
- Glossary: `CONTEXT.md` (Reading Surface, Editor Font Size, Design Tokens, GitHub Alert, Actionable Empty State, Frontmatter Presentation, PlantUML terms).
- After this spec: `$to-tickets` into `.scratch/ux-polish-mve/issues/NN-*.md`, then `$implement` per ticket (Codex), blockers-first.
