# OVM Studio backlog — updated 2026-09-21

## Status

- **Closed:** ADR 0007–0016 on `main` tip **`805a706`** (0016 Reading Surface default beauty + product/ui PASS).
- **Current mode:** **soak `main` at `805a706`.** No new product tickets until real-user friction on `markdownViewer`. Forge on standby.

## Soak rules

- Collect friction from real use on `markdownViewer` only.
- Do not reopen closed ADRs as greenfield; extend only with proof.
- Appearance changes must continue to honor ADR 0015 (no pretty-normalize write-back).

## Harness / polish residuals (do not block soak)

| Item | From | Notes |
|------|------|--------|
| more menu refinement | 0016 | |
| line-height Settings exposure | 0016 | fixed 1.75 for now |
| Table cell precise-edit GUI | 0015 | |
| Find / popover continuous GUI | 0011–0014 | |
| Dark/HC extra coverage | 0010–0011 | unless Light shows real bug |
| Theme mid-flash / Retry harness | 0013 | |

## Next wave trigger

Open ADR 0017+ only when Studio has concrete friction (who / what / repro on `markdownViewer`). Flow: @product triage → @architect ADR → @ui criteria → @forge impl.
