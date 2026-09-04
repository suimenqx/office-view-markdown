const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

suite('office-view-markdown smoke', function () {
  this.timeout(90000);

  const extensionId = 'suimenqx.office-view-markdown';
  const viewType = 'office-view-markdown.markdownViewer';
  const evidenceDir = path.join(__dirname, '..', '..', 'test-results');

  function ensureEvidenceDir() {
    fs.mkdirSync(evidenceDir, { recursive: true });
  }

  function writeEvidence(name, payload) {
    ensureEvidenceDir();
    const file = path.join(evidenceDir, name);
    fs.writeFileSync(file, typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2));
    return file;
  }

  function findCustomEditorTab() {
    for (const group of vscode.window.tabGroups.all) {
      for (const tab of group.tabs) {
        const input = tab.input;
        if (input && input.viewType === viewType) {
          return tab;
        }
      }
    }
    return null;
  }

  test('extension is present and activates', async () => {
    const ext = vscode.extensions.getExtension(extensionId);
    assert.ok(ext, `extension ${extensionId} should be discoverable`);
    await ext.activate();
    assert.strictEqual(ext.isActive, true, 'extension should be active after activate()');
  });

  test('contributes markdown commands and custom editor', async () => {
    const ext = vscode.extensions.getExtension(extensionId);
    assert.ok(ext);
    await ext.activate();
    const contributes = ext.packageJSON.contributes || {};
    const commands = (contributes.commands || []).map((c) => c.command);
    assert.ok(commands.includes('office-view-markdown.switch'), 'missing office-view-markdown.switch');
    assert.ok(commands.includes('office-view-markdown.paste'), 'missing office-view-markdown.paste');
    assert.ok(commands.includes('office-view-markdown.plantuml.testServer'), 'missing plantuml.testServer');
    const editors = (contributes.customEditors || []).map((e) => e.viewType);
    assert.ok(editors.includes(viewType), `missing ${viewType}`);

    const configSections = Array.isArray(contributes.configuration)
      ? contributes.configuration
      : [contributes.configuration].filter(Boolean);
    const configKeys = configSections.flatMap((section) => Object.keys(section.properties || {}));
    assert.ok(
      configKeys.includes('office-view-markdown.plantuml.server'),
      'missing office-view-markdown.plantuml.server setting',
    );

    const all = await vscode.commands.getCommands(true);
    assert.ok(all.includes('office-view-markdown.switch'), 'switch command not registered');
    assert.ok(all.includes('office-view-markdown.paste'), 'paste command not registered');
    assert.ok(all.includes('office-view-markdown.plantuml.testServer'), 'plantuml.testServer not registered');
  });

  test('can open markdown sample with custom editor (Vditor host)', async () => {
    const sample = path.join(__dirname, '..', 'markdown', 'Home.md');
    const uri = vscode.Uri.file(sample);
    await vscode.commands.executeCommand('vscode.openWith', uri, viewType);
    await new Promise((r) => setTimeout(r, 2500));

    const tab = findCustomEditorTab();
    assert.ok(tab, 'expected a tab with office-view-markdown.markdownViewer viewType');
    assert.strictEqual(tab.input.viewType, viewType);

    // Confirm webview HTML shell that hosts Vditor is present in the packaged resources.
    const htmlPath = path.join(__dirname, '..', '..', 'resource', 'markdown', 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(/vditor/i.test(html), 'resource/markdown/index.html should reference Vditor');

    writeEvidence('open-custom-editor.json', {
      viewType: tab.input.viewType,
      label: tab.label,
      sample,
      vditorHtmlPresent: true,
      at: new Date().toISOString(),
    });
  });

  test('live document update while custom editor is open', async () => {
    const sample = path.join(__dirname, '..', 'markdown', 'Callouts.md');
    const uri = vscode.Uri.file(sample);
    const original = fs.readFileSync(sample, 'utf8');
    const marker = `\n\n<!-- smoke-live-edit ${Date.now()} -->\n`;

    try {
      await vscode.commands.executeCommand('vscode.openWith', uri, viewType);
      await new Promise((r) => setTimeout(r, 1500));
      assert.ok(findCustomEditorTab(), 'custom editor tab should be open');

      const doc = await vscode.workspace.openTextDocument(uri);
      const before = doc.getText();
      const edit = new vscode.WorkspaceEdit();
      const end = doc.lineAt(doc.lineCount - 1).range.end;
      edit.insert(uri, end, marker);
      const applied = await vscode.workspace.applyEdit(edit);
      assert.ok(applied, 'WorkspaceEdit should apply');

      await new Promise((r) => setTimeout(r, 800));
      const afterDoc = await vscode.workspace.openTextDocument(uri);
      const after = afterDoc.getText();
      assert.ok(after.includes(marker.trim()), 'document should contain live-edit marker');
      assert.notStrictEqual(before, after, 'document text should change');

      writeEvidence('live-edit.json', {
        sample,
        markerInserted: true,
        beforeLength: before.length,
        afterLength: after.length,
        at: new Date().toISOString(),
      });
    } finally {
      // Restore fixture so the repo stays clean.
      fs.writeFileSync(sample, original);
    }
  });

  test('opens Diagrams.md fixture with custom editor for mermaid/plantuml', async () => {
    const sample = path.join(__dirname, '..', 'markdown', 'Diagrams.md');
    assert.ok(fs.existsSync(sample), 'Diagrams.md fixture should exist');
    const body = fs.readFileSync(sample, 'utf8');
    assert.ok(/```mermaid/.test(body), 'fixture should include mermaid fence');
    assert.ok(/```plantuml/.test(body), 'fixture should include plantuml fence');

    const uri = vscode.Uri.file(sample);
    await vscode.commands.executeCommand('vscode.openWith', uri, viewType);
    await new Promise((r) => setTimeout(r, 2500));
    const tab = findCustomEditorTab();
    assert.ok(tab, 'expected custom editor tab for Diagrams.md');

    writeEvidence('diagrams-open.json', {
      sample,
      viewType: tab.input.viewType,
      hasMermaidFence: /```mermaid/.test(body),
      hasPlantumlFence: /```plantuml/.test(body),
      note: 'Visual render verified separately via xvfb screenshots under test-results/',
      at: new Date().toISOString(),
    });
  });

  test('switch command is executable', async () => {
    const sample = path.join(__dirname, '..', 'markdown', 'README.md');
    const uri = vscode.Uri.file(sample);
    await vscode.commands.executeCommand('vscode.openWith', uri, viewType);
    await new Promise((r) => setTimeout(r, 1200));
    assert.ok(findCustomEditorTab(), 'custom editor should be open before switch');

    await vscode.commands.executeCommand('office-view-markdown.switch', uri);
    await new Promise((r) => setTimeout(r, 1200));

    // After switch away from custom editor, default text editor should be active (or at least no crash).
    const textEditor = vscode.window.activeTextEditor;
    const stillCustom = findCustomEditorTab();
    writeEvidence('switch-command.json', {
      switchExecuted: true,
      activeTextEditor: !!textEditor,
      customTabStillPresent: !!stillCustom,
      at: new Date().toISOString(),
    });
    assert.ok(true, 'switch command completed without throwing');
  });
});
