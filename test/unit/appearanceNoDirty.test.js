const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildSync } = require('esbuild');

const root = path.join(__dirname, '..', '..');

function loadModule(entryPoint, name) {
  const outfile = path.join(os.tmpdir(), `${name}-test-${process.pid}.cjs`);
  buildSync({
    entryPoints: [path.join(root, entryPoint)],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile,
    logLevel: 'silent',
    define: { VDITOR_VERSION: '"0.1.0"' },
  });
  try {
    delete require.cache[require.resolve(outfile)];
    return require(outfile);
  } finally {
    try { fs.unlinkSync(outfile); } catch (_) { /* ignore */ }
  }
}

function main() {
  const gate = loadModule('vditor/src/ts/util/appearanceWriteGate.ts', 'appearance-gate');
  const save = loadModule('vditor/src/ts/util/saveToolbarState.ts', 'appearance-save');
  const fidelity = loadModule('vditor/src/ts/util/writeBackFidelity.ts', 'appearance-fidelity');

  // Source seam: appearance modules must not schedule write-back.
  const appearanceSources = [
    'vditor/src/ts/ui/setEditorTheme.ts',
    'vditor/src/ts/toolbar/Settings.ts',
    'vditor/src/ts/ui/settingsPanel.ts',
  ];
  for (const rel of appearanceSources) {
    const src = fs.readFileSync(path.join(root, rel), 'utf8');
    for (const api of gate.APPEARANCE_WRITE_FORBIDDEN_APIS) {
      assert.doesNotMatch(src, new RegExp(`\\b${api}\\b`), `${rel} must not call ${api}`);
    }
  }

  // Auto chrome tokens derive from --vscode-* for table/outline/toolbar/blockquote.
  const autoCss = fs.readFileSync(path.join(root, 'vditor/src/css/editor-theme/Auto.css'), 'utf8');
  for (const token of [
    '--blockquote-border',
    '--table-header-bg',
    '--toolbar-background-color',
    '--outline-bg-color',
    '--vscode-textBlockQuote-border',
    '--vscode-sideBar-background',
    '--vscode-editorGroupHeader-tabsBackground',
    '--vscode-contrastBorder',
  ]) {
    assert.ok(autoCss.includes(token), `Auto.css should reference ${token}`);
  }

  // Runtime: appearance CSS patch does not dirty / does not fire input.
  let inputCount = 0;
  const vditor = {
    options: { input() { inputCount++; } },
    toolbar: { elements: {} },
  };
  const authored = '|a|b|\n|---|---|\n';
  fidelity.noteAuthoredSource(vditor, authored);
  save.initSaveToolbarState(vditor, authored);
  assert.strictEqual(save.isDocumentDirty(vditor), false);

  const el = {
    style: { props: {}, setProperty(k, v) { this.props[k] = v; }, getPropertyValue(k) { return this.props[k] || ''; } },
    attrs: {},
    setAttribute(k, v) { this.attrs[k] = v; },
    getAttribute(k) { return this.attrs[k]; },
  };
  // minimal documentElement stub for applyAppearanceCssOnly
  const prevDoc = global.document;
  global.document = {
    documentElement: { setAttribute() {}, getAttribute() { return null; } },
  };
  try {
    gate.applyAppearanceCssOnly(el, { theme: 'Auto', fontSizePx: 18, lineHeight: 1.75 });
  } finally {
    global.document = prevDoc;
  }
  assert.strictEqual(el.attrs['data-editor-theme'], 'Auto');
  assert.strictEqual(el.style.props['--editor-font-size'], '18px');
  assert.strictEqual(el.style.props['--editor-line-height'], '1.75');
  assert.strictEqual(save.isDocumentDirty(vditor), false);
  assert.strictEqual(gate.assertAppearanceLeavesDocumentClean(vditor), true);
  assert.strictEqual(inputCount, 0);

  // No-intent write still skipped after appearance (ADR 0015 intact).
  assert.strictEqual(save.fireContentInput(vditor, authored, { authoredIntent: false }), false);
  assert.strictEqual(save.isDocumentDirty(vditor), false);
  assert.strictEqual(inputCount, 0);

  console.log('appearance no-dirty unit tests passed');
}

main();
