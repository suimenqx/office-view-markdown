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
  const settings = loadModule('vditor/src/ts/util/globalLocalStorageSettings.ts', 'reading-surface-defaults');
  assert.strictEqual(settings.LINE_HEIGHT_DEFAULT, 1.75);
  assert.strictEqual(settings.READING_SURFACE_MAX_WIDTH_DEFAULT, 'min(100%, 52rem)');
  assert.strictEqual(settings.PAGE_WIDTH_DEFAULT, '100%');

  const less = fs.readFileSync(path.join(root, 'vditor/src/assets/less/index.less'), 'utf8');
  assert.match(less, /--editor-line-height:\s*1\.75;/);
  assert.match(less, /--reading-surface-max-width:\s*min\(100%,\s*52rem\);/);
  assert.doesNotMatch(less, /@import url\(['"]https?:\/\//);
  assert.doesNotMatch(less, /fonts\.googleapis/);

  const host = loadModule('src/common/editorFontSize.ts', 'editor-font-product');
  assert.strictEqual(host.EDITOR_FONT_SIZE_PRODUCT_DEFAULT, 16);
  assert.strictEqual(host.resolveEditorFontSize(0, 14), 14);
  assert.strictEqual(host.resolveEditorFontSize(16, 14), 16);

  console.log('reading surface defaults unit tests passed');
}

main();
