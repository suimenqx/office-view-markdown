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
