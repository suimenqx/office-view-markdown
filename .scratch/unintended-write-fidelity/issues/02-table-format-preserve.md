# 02: Table format preserve on Md↔DOM (untouched tables)

**What to build:** ADR 0015 residual (2). Lute `Md → VditorDOM → Md` must not cosmetically normalize **untouched** tables into git-visible churn (e.g. `|a|b|` → `| a | b |`, alignment-row pad/collapse, trailing newline churn). Prefer fidelity of the user’s on-disk table formatting over “pretty” serialization for regions without edit intent. Round-trip fixtures on `markdownViewer`: compact tables stay byte-stable until that table is edited. Do **not** reopen paste/table polish (ADR 0007) as greenfield — this is serialize fidelity for no-intent paths, not paste routing.

**Blocked by:** Forge sequence after 01 (gate first); coordinate with 03 for span-level preserve. Prefer land on Lute/getMarkdown / table serialize seams.

**Status:** done

**ui 观感：** 未动表不进 diff；无意图写回不「变漂亮」。

- [x] Untouched compact tables (`|a|b|`) survive Md↔DOM↔Md without padding/normalize churn
- [x] Alignment rows / trailing newlines for untouched tables stay authored-stable
- [x] Edited tables may change intentionally; no-intent path never pretty-rewrites them
- [x] No ADR 0007 greenfield reopen / spreadsheet UI
- [x] Unit + git/diff fixtures; Light smoke on markdownViewer; build green

## Comments

- 2026-09-15 (UTC): `getMarkdown()` now restores the authored source when
  Lute's semantic spans are unchanged, including compact table padding,
  alignment markers, and trailing line endings. This is source fidelity, not
  an auto-pretty-format feature.
- Verification: Lute compact-table round-trip fixture plus
  `writeBackFidelity.test.js`; `npm run build`.
