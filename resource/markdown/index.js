import { getToolbar, bindShortcut, createContextMenu, } from "./util.js";
import { observeWorkspaceAbsoluteImages, createMarkdownValueReader, restoreWorkspaceBaseUrls, } from "./imagePath.js";
import { mapVscodeLanguageToVditorLang } from "./lang.js";

handler.on("open", async (md) => {
  const { content, rootPath, workspaceBaseUrl, documentCacheId, pendingFragment, shouldRestoreFocus, config } = md;
  const {
    language, isWeb, isDev, markdown,
    editMode, editorTheme, codeMirrorTheme, mermaidTheme, plantumlServer, editorFontSize, frontMatterPresentation
  } = config;
  if (isWeb) {
    document.body.classList.add('is-web')
  }
  let editor;
  const getMarkdownValue = createMarkdownValueReader(() => editor, workspaceBaseUrl);
  editor = new Vditor('vditor', {
    value: content,
    cdn: rootPath,
    height: '100%',
    outline: {
      position: 'left',
    },
    cache: {
      enable: false,
      id: documentCacheId,
      focusHost: 'vscode',
    },
    mode: editMode,
    editorTheme,
    codeMirrorTheme,
    mermaidTheme,
    plantumlServer: plantumlServer || '',
    editorFontSize,
    frontMatterPresentation: frontMatterPresentation === 'chips' ? 'chips' : 'table',
    lang: mapVscodeLanguageToVditorLang(language),
    tab: '\t',
    toolbar: await getToolbar(() => {
      handler.emit('doSave', getMarkdownValue());
      editor?.markSaved();
    }),
    onLinkClick(payload, event) {
      const isCompose = event.metaKey || event.ctrlKey;
      if (payload.action !== "dblclick" && !(payload.action === "click" && isCompose)) {
        return;
      }
      if (payload.type === "footnote-ref") {
        editor.scrollToBlock(`footnote:${payload.href}`);
        return;
      }
      if (payload.href?.startsWith("#")) {
        editor.scrollToBlock(payload.href);
        return;
      }
      let uri = payload.href;
      if (payload.type === "wikilink" || payload.type === "wikilink-embed") {
        const hashIndex = uri.indexOf("#");
        const page = hashIndex < 0 ? uri : uri.slice(0, hashIndex);
        const fragment = hashIndex < 0 ? "" : uri.slice(hashIndex + 1);
        if (!page && fragment) {
          editor.scrollToBlock(fragment);
          return;
        }
        uri = `wiki:${payload.href}`;
      }
      handler.emit("openLink", uri);
    },
    debugger: isDev,
    changeEditorTheme(theme) {
      handler.emit('editorTheme', theme)
    },
    changeCodeTheme(theme) {
      handler.emit('codeMirrorTheme', theme)
    },
    changeMermaidTheme(theme) {
      handler.emit('mermaidTheme', theme)
    },
    onOpenPlantumlSettings() {
      handler.emit('openPlantumlSettings')
    },
    changeEditMode(mode) {
      handler.emit('editMode', mode)
    },
    onSettingsChange(settings) {
      handler.emit('syncViewerSettings', settings)
    },
    onEditorFontSizeChange(fontSize) {
      handler.emit('editorFontSize', fontSize)
    },
    onEditSettings() {
      handler.emit('editViewerSettings', editor.exportViewerSettings())
    },
    input(content) {
      handler.emit("save", restoreWorkspaceBaseUrls(content, workspaceBaseUrl))
    },
    upload: {
      url: '/image',
      accept: 'image/*',
      handler(files) {
        const file = files[0];
        const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
        let reader = new FileReader();
        reader.readAsBinaryString(file);
        reader.onloadend = () => {
          handler.emit("img", { data: reader.result, ext })
        };
      }
    },
    preview: {
      math: {
        macros: markdown?.math?.macros ?? {},
      },
    },
    after() {
      const { viewerSettings } = md;
      observeWorkspaceAbsoluteImages(document.getElementById('vditor'), workspaceBaseUrl);
      if (viewerSettings?.enabled) {
        editor.setViewerSettingsSyncEnabled(true);
        if (viewerSettings.settings) {
          editor.applyViewerSettings(viewerSettings.settings);
        }
      }
      // Host Editor Font Size must win on first paint (no localStorage override jump).
      if (editorFontSize !== undefined) {
        editor.setEditorFontSize(editorFontSize);
      }
      handler.on('viewerSettingsSync', ({ enabled }) => {
        editor.setViewerSettingsSyncEnabled(!!enabled);
      });
      handler.on('viewerSettings', (settings) => {
        editor.applyViewerSettings(settings);
        if (editorFontSize !== undefined) {
          editor.setEditorFontSize(editorFontSize);
        }
      });
      handler.on('markdownConfig', (update) => {
        if (update.editorTheme !== undefined) {
          editor.setEditorTheme(update.editorTheme);
        }
        if (update.codeMirrorTheme !== undefined) {
          Vditor.setCodeTheme(update.codeMirrorTheme, editor.vditor?.element);
        }
        if (update.mermaidTheme !== undefined) {
          editor.setMermaidTheme(update.mermaidTheme);
        }
        if (update.plantumlServer !== undefined) {
          editor.setPlantumlServer(update.plantumlServer || '');
        }
        if (update.editMode !== undefined) {
          editor.switchEditMode(update.editMode);
        }
        if (update.editorFontSize !== undefined) {
          editor.setEditorFontSize(update.editorFontSize);
        }
        if (update.frontMatterPresentation !== undefined) {
          editor.setFrontMatterPresentation(update.frontMatterPresentation);
        }
      });
      handler.on("update", content => {
        if (document.querySelector("[data-type='yaml-front-matter'].vditor-code-block--cm .cm-editor.cm-focused")) {
          return;
        }
        if (getMarkdownValue() === content) {
          return;
        }
        editor.setValue(content);
        editor.markSaved();
      })
      handler.on("insertImageMarkdown", (markdown) => {
        editor.insertMarkdown(markdown);
      })
      handler.on("gotoBlock", (fragment) => {
        if (fragment) {
          editor.scrollToBlock(fragment);
        }
      })
      let revealed = false;
      const revealReadingSurface = () => {
        if (revealed) {
          return;
        }
        revealed = true;
        if (pendingFragment) {
          editor.scrollToBlock(pendingFragment);
        }
        document.documentElement.classList.remove("ovm-boot");
      };
      editor.restoreDocumentSession(true, !!shouldRestoreFocus, revealReadingSurface);
      window.setTimeout(revealReadingSurface, 2000);
    }
  })
  bindShortcut(handler, editor, workspaceBaseUrl);
  createContextMenu(editor)
}).emit("init")
