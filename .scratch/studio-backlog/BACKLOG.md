# OVM Studio backlog — updated 2026-09-15

## Status

- **Closed:** ADR 0007–0015 on `main` tip **`841e30d`** (0015 unintended write-back fidelity + ui PASS).
- **Current mode:** **soak `main` at `841e30d`.** No new product tickets until real-user friction on `markdownViewer`. Forge on standby.

## Soak rules

- Collect friction from real use on `markdownViewer` only.
- Do not open density polish without evidence.
- Do not reopen closed ADRs as greenfield; extend only with proof.

## Harness residuals (do not block soak)

| Item | From | Notes |
|------|------|--------|
| Table cell precise-edit GUI (xvfb) | 0015 | unit/local-dirty PASS |
| Find GUI type-into-FindBar | 0011 / 0014 | unit/source PASS |
| popover plain-click continuous GUI | 0012 / 0014 | contract+unit PASS |
| Dark / HC coverage | 0010 / 0011 | unless Light shows real bug |
| Enter / Backspace / Tab weak frames | 0010 | |
| Replace GUI automation | 0011 | |
| Theme mid-flash / Retry harness | 0013 | |
| Task/link GUI under-proven | 0009 | |

## Next wave trigger

Open ADR 0016+ only when Studio has concrete friction (who / what / repro on `markdownViewer`). Flow: @product triage → @architect ADR → @ui criteria → @forge impl.
