const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildSync } = require('esbuild');

const root = path.join(__dirname, '..', '..');
const outfile = path.join(os.tmpdir(), `imageFigure-test-${process.pid}.cjs`);

buildSync({
  entryPoints: [path.join(root, 'vditor/src/ts/preview/imageFigure.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile,
  logLevel: 'silent',
});

try {
  const { getImageCaption } = require(outfile);
  const image = (attrs) => ({ getAttribute(name) { return attrs[name] ?? null; } });
  assert.strictEqual(getImageCaption(image({ title: 'A title', alt: 'Alt text' })), 'A title');
  assert.strictEqual(getImageCaption(image({ title: '  ', alt: 'Alt text' })), 'Alt text');
  assert.strictEqual(getImageCaption(image({ alt: '  ' })), '');
  console.log('image figure unit tests passed');
} finally {
  try { fs.unlinkSync(outfile); } catch (_) { /* ignore */ }
}
