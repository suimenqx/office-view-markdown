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
  const fidelity = loadModule('vditor/src/ts/util/writeBackFidelity.ts', 'write-back-fidelity');
  require(path.join(root, 'vditor/src/js/lute/lute.min.js'));
  const lute = global.Lute.New();
  const compactTable = '|a|b|\n|---|---|';
  const luteRoundTrip = lute.VditorDOM2Md(lute.Md2VditorDOM(compactTable));
  assert.notStrictEqual(luteRoundTrip, compactTable);
  assert.strictEqual(fidelity.preserveAuthoredSpans(compactTable, luteRoundTrip), compactTable);

  const original = [
    '# title',
    '',
    '|a|b|',
    '|---|---|',
    '',
    'unchanged prose',
    '',
    '|x|y|',
    '|---|---|',
    '',
  ].join('\n');
  const normalized = [
    '# title',
    '',
    '| a | b |',
    '| - | - |',
    '',
    'unchanged prose',
    '',
    '| x | y |',
    '| - | - |',
  ].join('\n');

  assert.strictEqual(fidelity.sourceFingerprint('a\r\nb'), 'a\nb');
  assert.strictEqual(fidelity.shouldSkipNoIntentWrite(normalized, original), true);
  assert.strictEqual(fidelity.shouldSkipNoIntentWrite('changed', original), true);
  assert.strictEqual(fidelity.shouldSkipNoIntentWrite('changed', original, true), false);
  assert.strictEqual(fidelity.shouldSkipNoIntentWrite('a\n', 'a\r\n', true), true);

  const vditor = { options: { input() {} } };
  fidelity.noteAuthoredSource(vditor, original);
  assert.strictEqual(fidelity.getAuthoredSource(vditor), original);
  assert.strictEqual(fidelity.preserveAuthoredSource(vditor, normalized), original);

  let inputCount = 0;
  const inputVditor = { options: { input() { inputCount++; } } };
  const save = loadModule('vditor/src/ts/util/saveToolbarState.ts', 'write-back-save-state');
  fidelity.noteAuthoredSource(inputVditor, original);
  assert.strictEqual(save.fireContentInput(inputVditor, normalized, { authoredIntent: false }), false);
  assert.strictEqual(inputCount, 0);
  assert.strictEqual(save.isDocumentDirty(inputVditor), false);
  fidelity.noteAuthoredIntent(inputVditor);
  const edited = normalized.replace('| a | b |', '| a changed | b |');
  assert.strictEqual(save.fireContentInput(inputVditor, edited, { authoredIntent: true }), true);
  assert.strictEqual(inputCount, 1);
  assert.strictEqual(save.isDocumentDirty(inputVditor), true);

  console.log('write-back fidelity unit tests passed');
}

main();
