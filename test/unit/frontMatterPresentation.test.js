const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildSync } = require('esbuild');

const root = path.join(__dirname, '..', '..');
const outfile = path.join(os.tmpdir(), `frontMatterPresentation-test-${process.pid}.cjs`);

buildSync({
  entryPoints: [path.join(root, 'vditor/src/ts/ui/frontMatterPresentation.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile,
  logLevel: 'silent',
});

try {
  const {
    applyFrontMatterPresentation,
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

  // Multi-value short tags remain chip-eligible; chips CSS must not hide list tails.
  assert.strictEqual(isShortFrontMatterProperty('tags', 'reading-surface smoke'), true);
  const less = fs.readFileSync(path.join(root, 'vditor/src/assets/less/_obsidian.less'), 'utf8');
  assert.ok(
    !/vditor-properties__row--chip\s+\.vditor-properties__list\s+li:not\(:first-child\)\s*\{\s*display:\s*none/s.test(less),
    'chips mode must not hide non-first multi-value list items',
  );

  class FakeEl {
    constructor(attrs = {}, text = '', children = []) {
      this.attributes = { ...attrs };
      this._text = text;
      this.children = children;
      this.classList = {
        _set: new Set(),
        toggle(name, on) {
          if (on) this._set.add(name);
          else this._set.delete(name);
        },
        contains(name) { return this._set.has(name); },
      };
    }
    getAttribute(name) { return this.attributes[name] ?? null; }
    get textContent() { return this._text || this.children.map((c) => c.textContent).join(''); }
    querySelector(sel) {
      if (sel === '.vditor-properties__value') {
        return this.children.find((c) => c.selector === 'value') || null;
      }
      return null;
    }
    querySelectorAll(sel) {
      if (sel === "[data-type='yaml-front-matter']") {
        return this._blocks || [];
      }
      if (sel === '.vditor-properties__row') {
        return this._rows || [];
      }
      return [];
    }
  }

  const value = new FakeEl({}, 'reading-surface smoke');
  value.selector = 'value';
  const row = new FakeEl({ 'data-key': 'tags' }, '', [value]);
  const block = new FakeEl();
  block._rows = [row];
  const rootNode = new FakeEl();
  rootNode._blocks = [block];
  applyFrontMatterPresentation(rootNode, 'chips');
  assert.ok(block.classList.contains('vditor-front-matter--chips'));
  assert.ok(row.classList.contains('vditor-properties__row--chip'));

  console.log('frontmatter presentation unit tests passed');
} finally {
  try { fs.unlinkSync(outfile); } catch (_) { /* ignore */ }
}
