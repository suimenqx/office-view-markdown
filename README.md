# Office View Markdown

`office-view-markdown` provides real-time WYSIWYG Markdown editing and live preview in Visual Studio Code.

> **Upstream attribution:** This fork is derived from Weijan Chen's MIT-licensed
> [vscode-office](https://github.com/cweijan/vscode-office) project. The original
> copyright and license notice are retained in [LICENSE](LICENSE); additional
> attribution details are recorded in [NOTICE](NOTICE).

## Features

- WYSIWYG and instant-rendering Markdown editing
- Markdown previews for code blocks, math, Mermaid, PlantUML, and embedded images
- Outline navigation, wiki links, document-state restoration, and editor themes
- Markdown image insertion and desktop clipboard-image paste
- Desktop and web extension hosts
- A polished Reading Surface with GitHub Alerts, table/task/image chrome, code-block copy feedback, and Frontmatter Presentation modes

The extension associates `.md` and `.markdown` files with **Office View Markdown**. To use VS Code's built-in text editor instead, add:

```json
{
  "workbench.editorAssociations": {
    "*.md": "default",
    "*.markdown": "default"
  }
}
```

Use **Switch Markdown Editor** from the editor title or press `Ctrl+Alt+E` (`⌃⌘E` on macOS) to switch between Office View Markdown and VS Code's text editor.

Additional editor shortcuts are documented in [shortcut.md](shortcut.md).

## Reading Surface settings

The Reading Surface follows VS Code's editor font family. Set
`office-view-markdown.editorFontSize` to `0` to follow `editor.fontSize`, or choose
an explicit size from 12–28px in the VS Code Settings UI or the editor's settings
panel. `office-view-markdown.frontMatterPresentation` defaults to the editable
`table` view; `chips` is an optional compact presentation for short metadata.


## PlantUML

PlantUML diagrams render through a user-configured **PlantUML Server Base URL**.

1. Open Settings and set **Office View Markdown › PlantUML: Server** (`office-view-markdown.plantuml.server`), for example `https://plantuml.example.com` or `https://host/plantuml`.
2. Optionally run **Office View Markdown: Test PlantUML Server Connectivity** (`office-view-markdown.plantuml.testServer`) to verify the server returns an image for a minimal diagram.

If the setting is empty, diagram source is not sent anywhere. The Reading Surface
shows an Actionable Empty State with an Open Settings action. Render failures use
the same pattern with Retry, and server authentication is not supported.

## Smoke fixture

[`test/markdown/UxPolish.md`](test/markdown/UxPolish.md) is the host-smoke sample
for the Reading Surface polish pass. It covers frontmatter, outline headings,
GitHub Alerts, tables, tasks, images, inline code, TypeScript labels, and an
unconfigured PlantUML block. Build and package it with:

```bash
npm run build
npm run package
```

The VS Code host smoke suite requires a VS Code test runtime and an installed
extension. When available, run `node test/smoke/run.js`; PlantUML mock-server
coverage is available through `node test/smoke/run-plantuml.js`.

## Development

Requirements:

- Node.js 20.19 or newer
- VS Code 1.64 or newer

```bash
npm install
npm run build
```

Run `npm run dev` for the desktop extension or `npm run dev:web` for the web extension, then launch the corresponding VS Code extension debug configuration.

Package a VSIX with:

```bash
npm run package
```

## Attribution and acknowledgments

Office View Markdown is a fork derived from the original
[vscode-office repository](https://github.com/cweijan/vscode-office), created by
Weijan Chen ([cweijan](https://github.com/cweijan)). Substantial portions of this
project originate from that MIT-licensed work. The upstream copyright and MIT
license notice remain in [LICENSE](LICENSE), and [NOTICE](NOTICE) identifies the
fork's modifications and provenance.

The Markdown editor is based on [Vditor](https://github.com/Vanessa219/vditor).

## License

See [LICENSE](LICENSE) and [NOTICE](NOTICE).
