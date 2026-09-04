# PlantUML uses SVG render paths and an explicit connectivity test

Rendering uses the PlantUML SVG path (`/svg/~1…`, with Base URL normalization: trim, strip trailing slash; if the base already ends with `/svg` or `/png`, only `/~1…` is appended, otherwise `/svg/~1…`). Connectivity is verified only via the `Test PlantUML Server` command against a minimal diagram, succeeding on HTTP 200 plus an image-like body—not via automatic probes when opening documents.
