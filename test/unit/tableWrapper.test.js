const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildSync } = require('esbuild');

const root = path.join(__dirname, '..', '..');
const outfile = path.join(os.tmpdir(), `tableWrapper-test-${process.pid}.cjs`);

buildSync({
  entryPoints: [path.join(root, 'vditor/src/ts/preview/tableWrapper.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile,
  logLevel: 'silent',
});

class FakeEl {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.attributes = {};
    this.className = '';
    this.children = [];
    this.parentElement = null;
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null; }
  removeAttribute(name) { delete this.attributes[name]; }
  closest(sel) {
    let node = this;
    while (node) {
      if (sel.includes('vditor-properties') && node.className.includes('vditor-properties')) return node;
      if (sel.includes('yaml-front-matter') && node.getAttribute('data-type') === 'yaml-front-matter') return node;
      node = node.parentElement;
    }
    return null;
  }
  querySelector(sel) {
    if (sel === 'table') {
      return this.children.find((c) => c.tagName === 'TABLE') || null;
    }
    return null;
  }
  querySelectorAll(sel) {
    const out = [];
    const walk = (node) => {
      if (sel === 'table' && node.tagName === 'TABLE') out.push(node);
      if (sel.includes('data-vditor-table-wrapper') && node.getAttribute('data-vditor-table-wrapper') === 'true') out.push(node);
      for (const child of node.children || []) walk(child);
    };
    for (const child of this.children) walk(child);
    if (sel === 'table' && this.tagName === 'TABLE') out.unshift(this);
    return out;
  }
  insertBefore(node, ref) {
    const idx = this.children.indexOf(ref);
    node.parentElement = this;
    if (idx === -1) this.children.push(node);
    else this.children.splice(idx, 0, node);
  }
  appendChild(node) {
    if (node.parentElement) {
      node.parentElement.children = node.parentElement.children.filter((c) => c !== node);
    }
    node.parentElement = this;
    this.children.push(node);
  }
  replaceWith(node) {
    const parent = this.parentElement;
    if (!parent) return;
    const idx = parent.children.indexOf(this);
    node.parentElement = parent;
    parent.children.splice(idx, 1, node);
  }
  remove() {
    if (!this.parentElement) return;
    this.parentElement.children = this.parentElement.children.filter((c) => c !== this);
    this.parentElement = null;
  }
}

global.document = {
  createElement(tag) { return new FakeEl(tag); },
};
global.HTMLTableElement = FakeEl;
global.HTMLElement = FakeEl;
global.Element = FakeEl;

try {
  const {
    enhanceTablePresentation,
    isTableBlockElement,
    resolveTableElement,
    stripTablePresentationFromClone,
  } = require(outfile);

  const bare = new FakeEl('table');
  assert.strictEqual(isTableBlockElement(bare), true);
  assert.strictEqual(resolveTableElement(bare), bare);

  const rootEl = new FakeEl('div');
  const table = new FakeEl('table');
  table.setAttribute('data-block', '0');
  table.parentElement = rootEl;
  rootEl.children = [table];

  enhanceTablePresentation(rootEl);
  assert.strictEqual(rootEl.children.length, 1);
  const wrapper = rootEl.children[0];
  assert.strictEqual(wrapper.getAttribute('data-vditor-table-wrapper'), 'true');
  assert.strictEqual(wrapper.className, 'vditor-table-wrapper');
  assert.strictEqual(wrapper.getAttribute('data-block'), '0');
  assert.ok(isTableBlockElement(wrapper));
  assert.strictEqual(resolveTableElement(wrapper), table);
  assert.strictEqual(table.getAttribute('data-block'), null);

  enhanceTablePresentation(rootEl);
  assert.strictEqual(rootEl.children.length, 1);

  stripTablePresentationFromClone(rootEl);
  assert.strictEqual(rootEl.children[0].tagName, 'TABLE');
  assert.strictEqual(rootEl.children[0].getAttribute('data-block'), '0');

  const less = fs.readFileSync(path.join(root, 'vditor/src/assets/less/_reset.less'), 'utf8');
  assert.ok(less.includes('.vditor-table-wrapper'));
  assert.ok(/\.vditor-table-wrapper[\s\S]*?border-radius:\s*var\(--radius-sm\)/.test(less));
  assert.ok(/\.vditor-table-wrapper[\s\S]*?overflow:\s*auto/.test(less));

  console.log('table wrapper unit tests passed');
} finally {
  try { fs.unlinkSync(outfile); } catch (_) { /* ignore */ }
}
