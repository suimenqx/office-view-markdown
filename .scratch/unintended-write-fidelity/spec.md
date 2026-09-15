# Spec: 「无意图写回保真」 / Unintended write-back fidelity

Status: ready-for-agent

## Problem Statement

After ADR 0009–0014, the Reading Surface still rewrites Markdown bytes **without user intent**. Forge/coco evidence on Studio: Lute `Md → VditorDOM → Md` normalizes tables (`|a|b|` → `| a | b |`); `afterRender` → `getMarkdown` → host `save` → `updateTextDocument` then writes that churn. Host already skips write only when equal after stripping `\r` (`markdownEditorProvider.updateTextDocument`); cold open with `enableInput: false` is OK, but **any** later `afterRender` rewrites untouched tables. Opening or passively rendering a doc can therefore dirty git with cosmetic table padding / alignment-row stretch and make untouched spans appear in diff. Architect **ADR 0015** (`f591eea`) names this as the next polish wave. This is **not** a new surface, **not** Option 2 density, and **not** a reopen of paste/table edit (0007) or residual hardening (0014).

## Solution

Lock **ADR 0015** unintended write-back fidelity for the existing Reading Surface (ADR 0004). Lead invariants:

> **When the Reading Surface syncs to the host text document, the written Markdown must change only because of a user intent (ADR 0009 commit). Passiveless Lute `Md → VditorDOM → Md` round-trips must not normalize tables or other blocks into git-visible churn (padding cells, collapsing/stretching alignment rows, trailing newlines) for regions the user did not edit. Opening a document alone must not dirty the file; UI/render paths that call `getMarkdown()` + host `save` without an authored edit must either skip write-back or preserve original source bytes for untouched spans. Prefer fidelity of the user’s on-disk formatting over “pretty” table serialization. Acceptance on `markdownViewer` with git/diff fixtures: compact tables stay byte-stable until edited; editing one cell must not rewrite every table in the file.**

Close the fidelity gap with three focused tickets: no-intent write gate / source fingerprint; table format preserve on Md↔DOM for untouched tables; dirty-region or span-preserving sync so one-cell edits do not rewrite all tables. Prefer on-disk formatting over pretty serialization.

**ui 观感 — provisional (Studio Light must-fix)** — two product-visible items:

1. 无编辑时不出现 dirty 闪烁 / 文件变脏（no dirty flash when user did not edit）。
2. 无意图时表格排版被改写即失败（table reformat without intent is fail）。

First acceptance surface: custom editor only — `office-view-markdown.markdownViewer`.

## User Stories

1. As an author, I open a Markdown file that contains compact tables (`|a|b|`) and do nothing; the file stays clean — no dirty indicator, no git churn from table padding or alignment-row normalize.
2. As an author, I passively scroll / wait for `afterRender` without editing; host write-back either skips or preserves original source bytes for untouched spans (equal after intent, not merely after `\r` strip of a pretty-printed table).
3. As an author, I edit one table cell; git/diff shows only that change (or the minimal intentional span) — other untouched tables in the same file keep their original formatting.
4. As an author, I do not see a second preview, a “pretty tables” auto-format feature, or a reopen of paste/table (0007) / residual hardening (0014) as greenfield.

## Implementation Decisions

- Obey ADR 0004 (stay inside native WYSIWYG Reading Surface) and locked **ADR 0015** at `docs/adr/0015-unintended-write-fidelity.md` (architect `f591eea`).
- Consume ADR 0009 (`commitAuthoredEdit` / intent boundary) as the canonical “has intent” signal; do not invent a second commit stack.
- **01 no-intent write gate / source fingerprint** — skip host save when serialized Markdown is byte-equivalent in intent to the last known source (stronger than `\r`-only equality); cover cold open + passive `afterRender` paths that call `getMarkdown` without an authored edit.
- **02 table format preserve on Md↔DOM** — untouched tables must round-trip without cosmetic normalize (`|a|b|` stays `|a|b|` until edited). Prefer fidelity over Lute “pretty” table serialization for regions without intent.
- **03 dirty-region / span-preserving sync** — editing one cell must not rewrite every table (or other untouched blocks) in the file; preserve original source bytes for spans outside the dirty region.
- **ui 观感 provisional** — no dirty flash when user did not edit; table reformat without intent is fail. Tighten with Studio Light shots during forge.
- Acceptance only on `office-view-markdown.markdownViewer`. Stock Markdown preview/editor does not count.
- Prefer git/diff fixtures + unit at write-back / Lute seams; extend SMOKE as needed. Do not invent Welcome / LLM / second preview.
- Forge sequence **01 → 02 → 03**; estimate **2.5–4.5d**. 01 gates false writes; 02/03 harden table fidelity and span preserve (02 may unblock 03 evidence).

## Acceptance Criteria

### ui 观感约束（与 ADR 0015 一一对应，Studio 锁定）

1. **无意图不闪 dirty**：用户未编辑时 tab 脏标不得闪一下（含 afterRender / 序列化 / 主题刷新路径）。
2. **局部编辑局部脏**：只改一处时，dirty/git 观感应对应该处；勿「整篇表重排」式满屏 diff 感。
3. **无意图写回 dirty 保持灭**：无意图写回被跳过或字节等价时，dirty 保持灭，不出现假脏再清。

反例（一律拒）：打开就脏、未动表却整表变漂亮进 diff、假脏闪一下。验收只认 `office-view-markdown.markdownViewer`。

### 功能验收

Lead with ADR 0015 invariant (custom editor only):

1. **No-intent skip** — Paths that call `getMarkdown()` + host save without ADR 0009 authored intent either skip write-back or leave source bytes unchanged for the whole document when no edit occurred (beyond `\r` normalization already present).
2. **Untouched table byte-stability** — Compact / authored table formatting stays byte-stable across Md→DOM→Md until that table is edited.
3. **Span-preserving edit** — Editing one cell (or one intentional span) must not rewrite every table / untouched block in the file; git/diff fixtures show only intentional change.
4. **No new surface** — No Welcome, second preview, LLM, auto-pretty-format product, or greenfield reopen of 0007/0014.
5. **First slice** — Issues 01 → 02 → 03 on `markdownViewer`; build + suite green with targeted tests / git-diff fixtures where seams allow.

## Testing Decisions

- Unit / seam: host write gate vs source fingerprint; Lute/table serialize fixtures (`|a|b|` vs padded); dirty-region or span merge leaving untouched tables byte-identical.
- Manual / host smoke on `markdownViewer` (Light blocking): open compact-table fixture → no dirty; wait afterRender → still clean; edit one cell → only that region diffs in git.
- Prefer git/diff fixtures under test or `.scratch` SMOKE note; agents leave a short SMOKE note when implementing.
- Dark/HC harness, Option 2 density, Welcome/LLM = out of gate.
- No PlantUML privacy / AES redesign tests.

## Out of Scope

- **No new Reading Surface** — no Welcome, automatic side preview, second preview, source-mode replacement, LLM / API-key, pretty-print-as-feature.
- **Do not reopen ADR 0007–0014 as greenfield.** Paste/table edit (0007), open-doc (0008), semantic tx (0009), caret (0010), find (0011), inline-object (0012), async-render (0013), residual hardening (0014) stay closed contracts; this wave **extends** write-back fidelity with evidence only.
- **Option 2** Reading Surface density leftovers.
- Changing PlantUML privacy (0001–0002), AES (0003), or inventing a second preview surface (ADR 0015 out of scope).
- Intentional user-driven format (user asked to reformat / paste that legitimately changes structure) — not “no-intent” churn.
- `_scratch` env hygiene (coco).

## Further Notes

- Studio 2026-09-15: intentional wave **locked** against ADR 0015; ends Option 3 soak-only stance for this friction. ui 观感 provisional = no dirty flash without edit; table reformat without intent is fail.
- Forge: implement **01 → 02 → 03**; estimate **2.5–4.5d**.
- Studio queue: residual hardening (DONE, ADR 0014 / `09d57d6`) → **unintended-write-fidelity** (this wave).
- Architect ADR 0015 (`f591eea`) + forge/coco Lute normalize notes drive this wave.
- Source anchors: `src/provider/markdownEditorProvider.ts` (`updateTextDocument` `\r`-strip equality); `vditor/src/ts/wysiwyg/afterRenderEvent.ts` (`getMarkdown` + fire); `vditor/src/ts/markdown/getMarkdown.ts`; Lute Md↔DOM table serialize; ADR 0009 `commitAuthoredEdit` intent boundary.
