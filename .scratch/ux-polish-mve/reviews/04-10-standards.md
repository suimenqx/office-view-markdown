# Standards — tickets 04–10 (`d4c0007...HEAD`)

Scope: product TS/LESS (+ provider wiring). Issue/scratch markdown, nls churn, and smoke fixtures omitted unless they show a pattern. eslint ignores `vditor/` — smells below are not tooling-covered.

## Documented standards

**No hard breaches.** Domain terms from `CONTEXT.md` (GitHub Alert, Actionable Empty State, Frontmatter Presentation, Reading Surface, Design Tokens) are used in APIs/docs. Aligns with ADR-0003 (actionable failures) and ADR-0005 (alerts presentation-only; source preserved via class + strip-on-export).

**Judgement — domain wording:** `getGitHubAlertClassForCallout` (`githubAlerts.ts`) names Lute’s `data-type='callout'` surface; `CONTEXT.md` avoids “callout” as product syntax. Prefer a GitHub-Alert-oriented name at the product boundary.

**Judgement — Design Tokens:** New chrome mostly uses `--radius*`, `--shadow-sm`, `--transition`, semantic `--info/--success/--warning/--error`. Residual magic spacing (`gap: 6px`, `padding: 12px 14px`, chips `999px`) in `_reset.less` / `_obsidian.less` matches prior local style more than a new token breach.

## Baseline smells (Fowler)

### Hard / strong judgement

1. **Duplicated Code** — identical alert refresh prelude in IR and WYSIWYG:
   - `vditor/src/ts/ir/process.ts` / `wysiwyg/afterRenderEvent.ts`:
     `alertScope = options.alertScope || getGitHubAlertEditScope(...); applyGitHubAlertClasses(...)`
   - Extract one shared after-render hook.

2. **Duplicated Code + Shotgun Surgery** — Md→DOM triad repeated at every mount site:
   - `markGitHubAlertSourceTitles` + `applyFrontMatterPresentation(resolveFrontMatterPresentation(...))` in `index.ts` (insert ×2, `setValue`), `toolbar/EditMode.ts`, `wysiwyg/renderDomByMd.ts`.
   - Gather into one “after Lute HTML” helper so new presentation modes don’t fan out again.

3. **Mysterious Name** — `removeActionableEmptyState` (`actionableEmptyState.ts`) deletes all `[data-vditor-generated='true']`, not only empty-state cards (image-error hosts share the attr). Narrow selector or rename to match actual scope.

### Softer judgement

4. **Feature Envy** — image load-failure host/hide/retry lives in `editorCommonEvent.ts` (`markImageLoading`) while figure chrome lives in `preview/imageFigure.ts`. Move failure presentation next to image helpers.

5. **Repeated Switches** — alert type → accent duplicated: `_reset.less` `blockquote.alert--*` and `_obsidian.less` `.alert--*` callout accents. Shared LESS map/mixin.

6. **Divergent Change / misplaced module** — `frontMatterPresentation.ts` under `codeBlock/` though frontmatter is properties chrome, not CodeMirror. Prefer `ui/` or `markdown/`.

7. **Formatting drift (vditor-local)** — `plantumlRender.ts` `onAction` body under-indented vs neighbors; not a Fowler smell, but inconsistent with surrounding modules.

## Clean / anti-smells

- `ActionableEmptyStateOptions` bundles the title/body/action **Data Clump**; PlantUML/Mermaid/image reuse it (ADR-0003).
- `LANGUAGE_LABEL_ALIASES` map beats ad-hoc switches (**Repeated Switches** avoided).
- Export path strips presentation (`stripGitHubAlertPresentation`, `stripImagePresentationFromClone`) — keeps ADR-0005 round-trip honest.

**Bottom line:** No documented hard violations. Main standards debt is duplicated Md→DOM / alert-scope wiring and an over-broad “generated” cleanup name—extract before the next polish ticket lands another presentation pass.
