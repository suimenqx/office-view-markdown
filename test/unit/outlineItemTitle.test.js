const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildSync } = require('esbuild');

const root = path.join(__dirname, '..', '..');
const outfile = path.join(os.tmpdir(), `outlineItemTitle-test-${process.pid}.cjs`);

buildSync({
  entryPoints: [path.join(root, 'vditor/src/ts/outline/outlineItemTitle.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile,
  logLevel: 'silent',
});

try {
  const { normalizeOutlineItemTitle, applyOutlineItemTitle } = require(outfile);

  assert.strictEqual(
    normalizeOutlineItemTitle('  Images and inline\nfigures  '),
    'Images and inline figures',
  );
  assert.strictEqual(normalizeOutlineItemTitle(''), '');
  assert.strictEqual(normalizeOutlineItemTitle(null), '');

  const attrs = {};
  const item = {
    textContent: 'fallback',
    setAttribute(name, value) { attrs[name] = String(value); },
    removeAttribute(name) { delete attrs[name]; },
  };

  applyOutlineItemTitle(item, '  Full heading title  ');
  assert.strictEqual(attrs.title, 'Full heading title');

  applyOutlineItemTitle(item, '   ');
  assert.strictEqual(attrs.title, undefined);

  applyOutlineItemTitle(item);
  assert.strictEqual(attrs.title, 'fallback');

  const css = fs.readFileSync(path.join(root, 'vditor/src/assets/less/_reset.less'), 'utf8');
  const outlineStart = css.indexOf('  &-outline {');
  const outlineEnd = css.indexOf('.vditor-editor-boundary', outlineStart);
  const outlineCss = css.slice(outlineStart, outlineEnd);
  assert.ok(outlineCss.includes('width: 280px;'), 'default outline width ~280px');
  assert.ok(outlineCss.includes('width: 245px;'), '1450 breakpoint raised');
  assert.ok(outlineCss.includes('width: 210px;'), '1200 breakpoint raised');
  assert.ok(outlineCss.includes('width: 175px;'), '992 breakpoint raised');
  assert.ok(!outlineCss.includes('width: max-content'), 'outline list should not use max-content');
  assert.ok(outlineCss.includes('overflow-x: hidden'), 'no horizontal scroll as primary');
  assert.ok(outlineCss.includes('text-overflow: ellipsis'), 'ellipsis on labels');
  assert.ok(outlineCss.includes('min-width: 0'), 'min-width 0 for flex ellipsis');

  console.log('outline item title / truncation unit tests passed');
} finally {
  try { fs.unlinkSync(outfile); } catch (_) { /* ignore */ }
}
