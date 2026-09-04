# Office View Markdown

Domain language for the Markdown-only VS Code extension: live WYSIWYG editing and preview, including diagram blocks.

## Language

**PlantUML Server**:
The HTTP(S) base address of a PlantUML render service that this extension calls to turn PlantUML source into a diagram image. The extension appends the standard PlantUML render path; the user does not supply a full URL template.
_Avoid_: PlantUML endpoint template, render URL, plantuml.com (as an implied default)

**PlantUML Server Base URL**:
The configured root of a PlantUML Server (for example `https://plantuml.example.com` or `https://host/plantuml`), stored in VS Code Settings and editable in the Settings UI (titled field, not an undocumented JSON-only key). When unset or blank, no remote render is attempted.
_Avoid_: hardcoded public server, silent fallback

**Server Connectivity Test**:
An explicit command that checks whether the configured PlantUML Server Base URL can render a minimal PlantUML diagram. Success means HTTP 200 and a body that looks like an image (SVG/`image/*`); it does not require opening a Markdown document.
_Avoid_: background health check, automatic probe on open

**Unconfigured PlantUML Server**:
The state when no PlantUML Server Base URL is set. Diagram source must not be sent to any third-party host; the preview shows a placeholder with a way to open Settings, and the connectivity-test command prompts the user to configure a server.
_Avoid_: defaulting to www.plantuml.com
