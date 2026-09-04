const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

suite('office-view-markdown plantuml smoke', function () {
  this.timeout(60000);
  const extensionId = 'suimenqx.office-view-markdown';
  const evidenceDir = path.join(__dirname, '..', '..', 'test-results');
  function writeEvidence(name, payload) {
    fs.mkdirSync(evidenceDir, { recursive: true });
    fs.writeFileSync(path.join(evidenceDir, name), JSON.stringify(payload, null, 2));
  }

  test('extension activates with plantuml contributes', async () => {
    const ext = vscode.extensions.getExtension(extensionId);
    assert.ok(ext);
    await ext.activate();
    const commands = (ext.packageJSON.contributes.commands || []).map((c) => c.command);
    assert.ok(commands.includes('office-view-markdown.plantuml.testServer'));
    const sections = Array.isArray(ext.packageJSON.contributes.configuration)
      ? ext.packageJSON.contributes.configuration
      : [ext.packageJSON.contributes.configuration].filter(Boolean);
    const keys = sections.flatMap((s) => Object.keys(s.properties || {}));
    assert.ok(keys.includes('office-view-markdown.plantuml.server'));
    const all = await vscode.commands.getCommands(true);
    assert.ok(all.includes('office-view-markdown.plantuml.testServer'));
  });

  test('privacy packaged: no plantuml.com; actionable state present', async () => {
    const ext = vscode.extensions.getExtension(extensionId);
    await ext.activate();
    const root = ext.extensionPath;
    const minJs = fs.readFileSync(path.join(root, 'resource/markdown/dist/index.min.js'), 'utf8');
    assert.ok(!/https?:\/\/(www\.)?plantuml\.com/i.test(minJs));
    assert.ok(/vditor-actionable-empty-state/.test(minJs));
    assert.ok(/Open Settings/.test(minJs));
    const cfg = vscode.workspace.getConfiguration('office-view-markdown');
    writeEvidence('plantuml-privacy.json', {
      extensionPath: root,
      plantumlServerConfig: cfg.get('plantuml.server', ''),
      noPlantumlCom: true,
      at: new Date().toISOString(),
    });
  });

  test('testServer command fires (message may remain open)', async () => {
    await vscode.extensions.getExtension(extensionId).activate();
    let error = null;
    const run = vscode.commands
      .executeCommand('office-view-markdown.plantuml.testServer')
      .catch((e) => { error = e; });
    await Promise.race([run, new Promise((r) => setTimeout(r, 2500))]);
    assert.ok(!error, error ? String(error) : '');
    const cfg = vscode.workspace.getConfiguration('office-view-markdown');
    writeEvidence('plantuml-testServer.json', {
      executed: true,
      plantumlServer: cfg.get('plantuml.server', ''),
      at: new Date().toISOString(),
    });
  });

  test('open Diagrams.md so configured render may hit mock server', async () => {
    const sample = path.join(__dirname, '..', 'markdown', 'Diagrams.md');
    const uri = vscode.Uri.file(sample);
    await vscode.commands.executeCommand('vscode.openWith', uri, 'office-view-markdown.markdownViewer');
    await new Promise((r) => setTimeout(r, 4000));
    writeEvidence('plantuml-diagrams-open.json', {
      sample,
      at: new Date().toISOString(),
    });
  });
});
