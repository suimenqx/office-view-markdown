# OVM Studio backlog — 2026-09-14

Pain points 1–5 mainline closed (ADR 0007–0013 + earlier polish). This page lists residuals and candidate next waves for Studio to prioritize.

## Closed mainline (do not reopen as “next polish” without new evidence)

| Wave | ADR | Tip of main (approx) |
|------|-----|----------------------|
| Paste + table | 0007 | through pasteDetect / paste-table polish |
| Failure-state honesty (AES) | 0003 expanded | `1213ac5` / smoke path later |
| Open-document stability | 0008 | `ddf912f` |
| Semantic edit transactions | 0009 | `891adac` |
| In-session caret continuity | 0010 | `7a60b78` |
| Document-semantic find | 0011 | `ffcfb00` |
| Inline-object activation | 0012 | `afd7406` |
| Async render generation | 0013 | `f01473a` |

Hard boundaries unchanged: single WYSIWYG `markdownViewer`, no Welcome / auto side preview / LLM / remote fonts / second preview surface.

## Residuals (trust → harness)

### A. Trust / contract gaps (product-visible if real)

1. **Prose still debounced `afterRender`** (0009 residual) — same undo stack, but multi-step grouping can still feel soft vs “one intent.”
2. **Task / link GUI smoke never cleanly hit** (0009) — unit wired `commitAuthoredEdit`; GUI path under-proven.
3. **Find input steals focus into CM / pollutes body** (0011) — xvfb brittle; may be harness-only or real focus bug.
4. **Inline popover plain-click edit → save → refocus** (0012) — contract+unit PASS; GUI continuous shots missing.
5. **Theme switch / mid-flight stale flash under live GUI** (0013) — unit/guard PASS; weak mid-flash & theme harness.

### B. Harness / theme coverage (do not confuse with product failure)

- Dark / HC selection & find highlight coverage (0010 / 0011)
- Enter / Backspace / Shift / Tab-leave-chrome weak frames (0010)
- Replace Current/All GUI automation (0011)
- Retry secondary click harness false damage (0013)
- Recurring xvfb popover / webview focus flakiness (0009–0012 family)

### C. Small env hygiene (coco)

- `_scratch` root scatter: `download-vscode-test.js`, `hello-restore.sh` → owner dirs

## Candidate next waves (pick one)

### Option 1 — Residual hardening (recommended default)

Close A-list with focused tickets + stronger smoke (not new product surface). Highest leverage: Find focus while typing (#3), popover refocus GUI (#4), prose transaction grouping (#1). Treat B-list as harness debt owned with forge/coco as needed.

### Option 2 — Reading Surface density leftovers

If product wants user-visible polish over debt: frontmatter chips density, code-block label/copy scanability, task/image micro-chrome — only where still uneven vs CONTEXT / old MVE tickets, still inside WYSIWYG.

### Option 3 — Stop and soak

Ship/soak current `main` (through `f01473a`); collect real-user friction for 1–2 weeks before opening ADR 0014+.

## Anti-goals for next wave

- Do not invent a second reading surface, Welcome, LLM, or default public PlantUML.
- Do not reopen 0007–0013 as greenfield; extend with evidence.
- Do not prioritize harness Dark/HC over A-list trust gaps unless a real theme bug is shown.

## Decision needed from Studio

@product: pick Option 1 / 2 / 3 (or a hybrid: short Option 1 slice then soak).  
@ui: call out any residual that is visually unacceptable in Light today.  
@forge: estimate Option 1 top-3 when product picks.
