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
  });
  try {
    delete require.cache[require.resolve(outfile)];
    return require(outfile);
  } finally {
    try { fs.unlinkSync(outfile); } catch (_) { /* ignore */ }
  }
}

function main() {
  const mod = loadModule('resource/markdown/toolbarComposition.js', 'toolbar-composition');
  const {
    PRIMARY_TOOLBAR_MAX_VISIBLE,
    composePrimaryToolbar,
    countPrimaryVisible,
    listPrimaryVisibleNames,
    primaryHasUpload,
    primaryThemeEntries,
    moreContainsUpload,
    listRightAnchoredNames,
    MORE_TOOLBAR_ITEMS,
  } = mod;

  const toolbar = composePrimaryToolbar(() => {}, (name) => name);
  const visible = listPrimaryVisibleNames(toolbar);
  const count = countPrimaryVisible(toolbar);

  assert.ok(count <= PRIMARY_TOOLBAR_MAX_VISIBLE, `visible ${count} should be ≤ ${PRIMARY_TOOLBAR_MAX_VISIBLE}`);
  assert.strictEqual(count, visible.length);
  assert.strictEqual(primaryHasUpload(toolbar), false, 'upload must not be on primary');
  assert.deepStrictEqual(primaryThemeEntries(toolbar), ['editor-theme'], 'single theme entry on primary');
  assert.strictEqual(moreContainsUpload(toolbar), true, 'upload reachable via more');
  assert.ok(MORE_TOOLBAR_ITEMS.includes('editor-theme-toggle'), 'secondary theme toggle lives under more');
  assert.ok(MORE_TOOLBAR_ITEMS.includes('upload'));

  for (const name of ['outline', 'bold', 'italic', 'link', 'list', 'table', 'undo', 'redo', 'find', 'more']) {
    assert.ok(visible.includes(name), `primary should include ${name}`);
  }

  const right = listRightAnchoredNames(toolbar);
  for (const name of ['save', 'edit-in-vscode', 'editor-theme', 'settings']) {
    assert.ok(right.includes(name), `right-anchored should include ${name}`);
  }

  console.log('toolbar composition unit tests passed');
}

main();
