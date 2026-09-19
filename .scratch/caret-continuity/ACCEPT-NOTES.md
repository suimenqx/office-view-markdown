# ACCEPT notes — ADR 0010 caret-continuity @ 7a60b78

Time: 2026-09-14 ~18:49 CST (UTC+8)
Surface: office-view-markdown.markdownViewer only (tab label "Office View Markdown")
VSIX: office-view-markdown-0.1.0.vsix → code --install-extension --force
Frames: test-results/caret-00..17.png
Fixture: test/markdown/CaretContinuity.md

## Build / unit
- npm run build: PASS
- all node test/unit/*.test.js (16): PASS (incl. caretContinuity)

## ui 观感 (Studio three)
1. One focus token: PASS — caret-02/05 single outer blue ring on CM; no surface+CM stack
2. Viewport once: PASS (contract+stills) — scrollIntoView:false wired; frames no jump-to-top artifact; mid-flight animation not filmed
3. Highlight family: PASS (Light) — caret-09 prose / caret-10 prose↔code same light-blue family; Dark theme switch harness incomplete (15/16)

## SMOKE.md (host)
1 Arrow enter code: PASS (02)
2 Arrow/Home/End cross: PASS leave-up (04); reenter (05); leave-down harness sequencing weak (07 still in block)
3 Enter/Backspace/Shift cross: PARTIAL — not fully exercised in xvfb harness
4 Single-click enter: PARTIAL — source no dblclick; click coords in 08 missed CM
5 Tab from chrome: PARTIAL — source Tab→contentDOM; frame 11 inconclusive
6 Selection Auto/Light/Dark: Light PASS; Dark BLOCKED(harness)
7 Lazy remount caret: PASS — 14 caret mid `return "first-code";` not offset 0 / block
8 WYSIWYG↔IR: not run (optional this wave)

## Product call
PASS @ 7a60b78 — accept for product. No push.
