# 09: Micro-interactions + Marketplace IA

**What to build:** Links show subtle hover underline; inline code uses slight border/emphasis via tokens; hrs are thin token-colored. Marketplace dark galleryBanner (~#0d1117) and command category “Office View Markdown”; settings keep markdownDescription + order. No speculative category sprawl.

**Blocked by:** 01 Design Tokens foundation

**Status:** ready-for-human

- [x] Link / inline code / hr micro-polish lands on the Reading Surface
- [x] package.json galleryBanner dark theme present
- [x] Commands use category Office View Markdown
- [x] New/updated settings remain documented in Settings UI

**Comments:** Added subtle Reading Surface link hover underlines, token-backed inline-code borders, and thin token-colored rules. Marketplace metadata now includes the dark `galleryBanner` and every contributed command uses the `Office View Markdown` category. New settings retain `markdownDescription` and explicit ordering. Verified with `node test/unit/marketplacePolish.test.js` and `npm run build`.
