# 02: Close remaining silent failure holes

**What to build:** Using `.scratch/silent-failure-inventory/NOTES.md`, ensure image / Mermaid / PlantUML failure paths all route through AES (no silent holes, no toast spam). Retry and Open Settings actions actually work.

**Blocked by:** 01 AES copy matrix + accent variants

**Status:** ready-for-agent

- [ ] Inventory seams checked; silent holes closed or documented as N/A
- [ ] Retry re-invokes render/load; Open Settings opens PlantUML settings when unconfigured
- [ ] No Welcome / second surface; build + unit green
