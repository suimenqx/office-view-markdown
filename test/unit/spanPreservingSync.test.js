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
  const fidelity = loadModule('vditor/src/ts/util/writeBackFidelity.ts', 'span-preserving-sync');
  const authored = [
    '# title',
    '',
    '|a|b|',
    '|---|---|',
    '',
    'prose keeps its authored bytes',
    '',
    '|x|y|',
    '|:---|---:|',
    '',
  ].join('\n');
  const serializedAfterCellEdit = [
    '# title',
    '',
    '| a changed | b |',
    '| - | - |',
    '',
    'prose keeps its authored bytes',
    '',
    '| x | y |',
    '| :--- | ---: |',
  ].join('\n');

  const synced = fidelity.preserveAuthoredSpans(authored, serializedAfterCellEdit, false);
  assert.match(synced, /\| a changed \| b \|/);
  assert.match(synced, /prose keeps its authored bytes/);
  assert.match(synced, /\|x\|y\|\n\|:---\|---:\|\n/);
  assert.strictEqual(
    synced.split('prose keeps its authored bytes')[1],
    authored.split('prose keeps its authored bytes')[1],
  );

  console.log('span-preserving sync unit tests passed');
}

main();
