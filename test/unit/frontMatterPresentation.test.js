const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildSync } = require('esbuild');

const root = path.join(__dirname, '..', '..');
const outfile = path.join(os.tmpdir(), `frontMatterPresentation-test-${process.pid}.cjs`);

buildSync({
  entryPoints: [path.join(root, 'vditor/src/ts/codeBlock/frontMatterPresentation.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile,
  logLevel: 'silent',
});

try {
  const {
    isShortFrontMatterProperty,
    resolveFrontMatterPresentation,
  } = require(outfile);
  assert.strictEqual(resolveFrontMatterPresentation('table'), 'table');
  assert.strictEqual(resolveFrontMatterPresentation('chips'), 'chips');
  assert.strictEqual(resolveFrontMatterPresentation('unknown'), 'table');
  assert.strictEqual(isShortFrontMatterProperty('title', 'Hello'), true);
  assert.strictEqual(isShortFrontMatterProperty('a'.repeat(33), 'Hello'), false);
  assert.strictEqual(isShortFrontMatterProperty('title', 'x'.repeat(97)), false);

  const pkg = require(path.join(root, 'package.json'));
  const sections = Array.isArray(pkg.contributes.configuration)
    ? pkg.contributes.configuration
    : [pkg.contributes.configuration].filter(Boolean);
  const setting = sections
    .map((section) => section.properties && section.properties['office-view-markdown.frontMatterPresentation'])
    .find(Boolean);
  assert.ok(setting, 'frontMatterPresentation setting missing');
  assert.deepStrictEqual(setting.enum, ['table', 'chips']);
  assert.strictEqual(setting.default, 'table');
  assert.ok(setting.markdownDescription);
  console.log('frontmatter presentation unit tests passed');
} finally {
  try { fs.unlinkSync(outfile); } catch (_) { /* ignore */ }
}
