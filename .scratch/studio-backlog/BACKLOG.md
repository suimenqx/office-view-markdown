# OVM Studio backlog — updated 2026-09-15

## Status

- **Closed mainline:** ADR 0007–0013 (pain 1–5) on `main`.
- **Residual hardening:** ADR 0014 closed at `09d57d6` + ui visual PASS (with harness residuals).
- **Current mode (Studio lock 2026-09-15):** **Option 3 — soak `main` at `09d57d6`.** No new product tickets until real-user friction appears. Forge on standby.

## Soak rules

- Collect friction from real use on `markdownViewer` only.
- Do not open Option 2 (Reading Surface density) without evidence.
- Do not reopen 0007–0014 as greenfield; extend only with proof.

## Backlog residuals (harness — do not block soak)

| Item | From | Notes |
|------|------|--------|
| Find GUI type-into-FindBar (xvfb often misses bar) | 0011 / 0014 | unit/source PASS |
| popover plain-click → save → refocus continuous GUI | 0012 / 0014 | contract+unit PASS |
| Dark / HC selection & find highlight coverage | 0010 / 0011 | unless Light shows real bug |
| Enter / Backspace / Tab-leave-chrome weak frames | 0010 | |
| Replace GUI automation | 0011 | |
| Theme mid-flash / Retry secondary harness | 0013 | |
| Task/link GUI smoke under-proven | 0009 | unit wired |
| `_scratch` root scatter (`download-vscode-test.js`, `hello-restore.sh`) | env | owner dirs |

## Next wave trigger

Open ADR 0015+ only when Studio has a concrete friction report (who / what / repro on `markdownViewer`). Default owner: @product triage → @architect ADR → @ui criteria → @forge impl.
