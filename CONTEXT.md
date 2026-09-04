# Office View Markdown

Domain language for the Markdown-only VS Code extension: live WYSIWYG editing and preview, including diagram blocks.

## Language

### Diagrams

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
The state when no PlantUML Server Base URL is set. Diagram source must not be sent to any third-party host; the Reading Surface shows an Actionable Empty State with a way to open Settings, and the connectivity-test command prompts the user to configure a server.
_Avoid_: defaulting to www.plantuml.com

### Reading and chrome

**Reading Surface**:
The WYSIWYG/IR document body as the user experiences it for reading while editing: measure (page width), type size, line height, and heading hierarchy—not a separate preview pane.
_Avoid_: preview panel, side preview, reading mode (as a second surface)

**Editor Font Size**:
The user-configurable type size of the Reading Surface, contributed as `office-view-markdown.editorFontSize`. Zero follows `editor.fontSize`; explicit values are 12–28px. It follows the VS Code editor font family and does not load remote or bundled web fonts.
_Avoid_: preview font size (as a separate product surface), Inter, JetBrains Mono (as product defaults)

**Design Tokens**:
Shared radius, shadow, transition, and semantic status colors used across editor chrome (toasts, placeholders, code blocks, tables) so surfaces feel like one product.
_Avoid_: one-off magic numbers per less file, independent “theme app” palette disconnected from VS Code

**GitHub Alert**:
A blockquote that starts with a GitHub-style alert marker such as `[!NOTE]`, `[!TIP]`, `[!WARNING]`, `[!CAUTION]`, or `[!IMPORTANT]`, shown with semantic color while preserving the underlying Markdown on edit.
_Avoid_: callout (as a different syntax), admonition (unless mapped explicitly)

**Actionable Empty State**:
A consistent empty or failure card (title, secondary explanation, primary action such as Open Settings or Retry) used when content or an external dependency cannot be shown.
_Avoid_: silent failure, ad-hoc alert-only toast without a next step

**Frontmatter Presentation**:
How YAML frontmatter / Properties are shown on the Reading Surface through `office-view-markdown.frontMatterPresentation`: editable table (full, the default) or compact chips (short metadata), without removing editability.
_Avoid_: read-only frontmatter strip as the only mode

### Smoke language

The UX-polish smoke fixture is `test/markdown/UxPolish.md`. It is a host-smoke
document, not a second product surface: it exercises Reading Surface headings,
GitHub Alerts, tables, tasks, images, code-block chrome, Frontmatter Presentation,
and the unconfigured PlantUML Actionable Empty State in one document.
