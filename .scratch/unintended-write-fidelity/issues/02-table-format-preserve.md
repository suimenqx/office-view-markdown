# 02: Table format preserve on Md↔DOM (untouched tables)

**What to build:** ADR 0015 residual (2). Lute `Md → VditorDOM → Md` must not cosmetically normalize **untouched** tables into git-visible churn (e.g. `|a|b|` → `| a | b |`, alignment-row pad/collapse, trailing newline churn). Prefer fidelity of the user’s on-disk table formatting over “pretty” serialization for regions without edit intent. Round-trip fixtures on `markdownViewer`: compact tables stay byte-stable until that table is edited. Do **not** reopen paste/table polish (ADR 0007) as greenfield — this is serialize fidelity for no-intent paths, not paste routing.

**Blocked by:** Forge sequence after 01 (gate first); coordinate with 03 for span-level preserve. Prefer land on Lute/getMarkdown / table serialize seams.

**Status:** ready-for-agent

**ui 观感：** 无意图时表格排版被改写即失败。

- [ ] Untouched compact tables (`|a|b|`) survive Md↔DOM↔Md without padding/normalize churn
- [ ] Alignment rows / trailing newlines for untouched tables stay authored-stable
- [ ] Edited tables may change intentionally; no-intent path never pretty-rewrites them
- [ ] No ADR 0007 greenfield reopen / spreadsheet UI
- [ ] Unit + git/diff fixtures; Light smoke on markdownViewer; build green

## Comments
