# OVM Studio backlog — updated 2026-09-15

## Status

- **Closed mainline:** ADR 0007–0013 (pain 1–5) on `main`.
- **Residual hardening:** ADR 0014 closed at `09d57d6` + ui visual PASS (with harness residuals).
- **Current mode (Studio lock 2026-09-15):** **Option 3 soak ended** for intentional friction → **ADR 0015 「无意图写回保真」** product-locked at `.scratch/unintended-write-fidelity/` (architect `f591eea`). Forge sequence **01 → 02 → 03**.

## Active wave

| Wave | ADR | Path | Forge order |
|------|-----|------|-------------|
| 无意图写回保真 / unintended-write-fidelity | 0015 (`f591eea`) | `.scratch/unintended-write-fidelity/` | 01 no-intent write gate → 02 table format preserve → 03 span-preserving sync |

## Soak / backlog rules

- Collect further friction from real use on `markdownViewer` only.
- Do not open Option 2 (Reading Surface density) without evidence.
- Do not reopen 0007–0014 as greenfield; extend only with proof.
- This wave ends soak-only stance **for this friction only**; unrelated A/B-list harness residuals stay non-blocking.

## Backlog residuals (harness — do not block 0015)

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

## Next after 0015

Return to soak on `markdownViewer` unless Studio has another concrete friction report (who / what / repro). Default owner: @product triage → @architect ADR → @ui criteria → @forge impl.
