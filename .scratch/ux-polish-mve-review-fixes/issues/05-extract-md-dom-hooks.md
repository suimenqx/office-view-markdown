# 05: Extract shared Md→DOM / alert hooks + narrow empty-state cleanup

**What to build:** One shared after-Lute-HTML helper for `markGitHubAlertSourceTitles` + frontmatter presentation apply at mount sites; one shared alert refresh prelude for IR + WYSIWYG; narrow or rename `removeActionableEmptyState` so it only removes Actionable Empty State cards (not all `data-vditor-generated`). Optionally relocate `frontMatterPresentation.ts` out of `codeBlock/` if low-risk.

**Blocked by:** 01 Fix chips Frontmatter multi-value display; 02 Table wrapper rounded clipping; 03 Image figure / figcaption policy

**Status:** done

- [x] Mount sites call one shared after-HTML presentation helper (no copy-paste triad)
- [x] IR and WYSIWYG share one alert refresh prelude
- [x] Empty-state removal only targets empty-state nodes (or API renamed to match real scope)
- [x] Build + existing unit tests pass

**Comments:** Added `afterLuteHtml.ts` and `alertRefresh.ts`; moved `frontMatterPresentation.ts` to `ui/`; narrowed `removeActionableEmptyState` to `.vditor-actionable-empty-state` with export-path cleanup for image-error hosts. Build + all unit tests green.
