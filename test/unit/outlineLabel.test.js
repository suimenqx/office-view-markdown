const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildSync } = require('esbuild');

const root = path.join(__dirname, '..', '..');
const outfile = path.join(os.tmpdir(), `outlineLabel-test-${process.pid}.cjs`);

buildSync({
  entryPoints: [path.join(root, 'vditor/src/ts/outline/outlineLabel.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile,
  logLevel: 'silent',
});

try {
  const { resolveOutlineHeader } = require(outfile);
  assert.strictEqual(resolveOutlineHeader({ outlineHeader: '本页目录', outline: '大纲' }), '本页目录');
  assert.strictEqual(resolveOutlineHeader({ outline: 'Outline' }), 'Outline');
  assert.strictEqual(resolveOutlineHeader({}), 'On this page');
  console.log('outline label unit tests passed');
} finally {
  try { fs.unlinkSync(outfile); } catch (_) { /* ignore */ }
}
