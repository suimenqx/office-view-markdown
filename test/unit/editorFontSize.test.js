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
  const host = loadModule('src/common/editorFontSize.ts', 'editorFontSize');
  const vditor = loadModule('vditor/src/ts/util/globalLocalStorageSettings.ts', 'vditorSettings');
  const {
    EDITOR_FONT_SIZE_MAX,
    EDITOR_FONT_SIZE_MIN,
    EDITOR_FONT_SIZE_STEP,
    resolveEditorFontSize,
  } = host;

  assert.deepStrictEqual(
    { min: EDITOR_FONT_SIZE_MIN, max: EDITOR_FONT_SIZE_MAX, step: EDITOR_FONT_SIZE_STEP },
    { min: 12, max: 28, step: 2 },
  );
  assert.strictEqual(resolveEditorFontSize(0, 18), 18);
  assert.strictEqual(resolveEditorFontSize(undefined, 16), 16);
  assert.strictEqual(resolveEditorFontSize(20, 16), 20);
  assert.strictEqual(resolveEditorFontSize(0, undefined), 14);
  assert.strictEqual(vditor.stepEditorFontSize(12, -2), 12);
  assert.strictEqual(vditor.stepEditorFontSize(12, 2), 14);
  assert.strictEqual(vditor.stepEditorFontSize(28, 2), 28);

  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const configuration = pkg.contributes.configuration.flatMap((section) => Object.values(section.properties || {}));
  const setting = configuration.find((property) => property && property.markdownDescription?.includes('Editor Font Size'));
  assert.ok(setting, 'Editor Font Size setting should be contributed with a markdownDescription');
  assert.strictEqual(setting.default, 0, 'zero should mean follow VS Code editor font size');
  assert.strictEqual(setting.minimum, 0);
  assert.strictEqual(setting.maximum, 28);
  assert.strictEqual(setting.step, 2);

  console.log('editor font size unit tests passed');
}

main();
