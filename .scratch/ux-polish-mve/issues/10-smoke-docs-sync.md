# 10: Smoke pack & docs sync

**What to build:** A sample Markdown exercising alerts, TOC, tables/tasks/images, code blocks, frontmatter modes, and PlantUML unconfigured empty state; extension builds and installs for host smoke; nls/README/CONTEXT touch-ups needed for new strings/settings. Version bump remains optional (do not force).

**Blocked by:** 02 Editor Font Size + Reading Surface type; 03 Outline / TOC chrome; 04 GitHub Alerts presentation; 05 Code-block labels & copy feedback; 06 Frontmatter Presentation (table | chips); 07 Actionable Empty State + host helper; 08 Tables, tasks, images polish; 09 Micro-interactions + Marketplace IA

**Status:** done

- [x] Sample Markdown covers the acceptance paths above
- [x] Build/package succeeds; host smoke checklist documented or run
- [x] i18n strings for new UI are present where required
- [x] No forced version bump unless explicitly requested later

## Comments

- Added `test/markdown/UxPolish.md` and its local SVG fixture covering frontmatter, outline headings, GitHub Alerts, tables, tasks, images, inline code, TypeScript labels, and an unconfigured PlantUML block.
- Added localized package descriptions for `office-view-markdown.editorFontSize` and `office-view-markdown.frontMatterPresentation`, plus README/CONTEXT smoke and settings guidance.
- Updated host smoke and PlantUML integration assertions to the shared Actionable Empty State contract and excluded generated `test-results` from VSIX packaging.
- Verified `node test/smoke/run.js` (9 passing), installed VSIX PlantUML mock smoke (4 passing), `node test/integration/plantumlProbe.integration.js`, `npm run build`, and `npx --yes @vscode/vsce package --no-dependencies` (version remains 0.1.0).
- The repository's `npm run package` script still requires a globally installed `vsce`; the equivalent `npx @vscode/vsce` package command succeeded in this environment.

## Comments

- Code review (04–10 range): see `.scratch/ux-polish-mve/reviews/04-10-summary.md` (Standards + Spec).
- Follow-up: `UxPolish.md` now exercises all five GitHub Alert types (NOTE/TIP/IMPORTANT/WARNING/CAUTION).
