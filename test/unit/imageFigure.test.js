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
  const { getImageCaption, imageCaptionIsWarranted } = require(outfile);
  const image = (attrs) => ({ getAttribute(name) { return attrs[name] ?? null; } });

  assert.strictEqual(imageCaptionIsWarranted(image({ title: 'A title', alt: 'x' })), true);
  assert.strictEqual(imageCaptionIsWarranted(image({ alt: 'Reading Surface sample' })), true);
  assert.strictEqual(imageCaptionIsWarranted(image({ alt: 'photo' })), false);
  assert.strictEqual(imageCaptionIsWarranted(image({ alt: 'diagram.png' })), false);
  assert.strictEqual(imageCaptionIsWarranted(image({ alt: 'ux-polish', src: 'assets/ux-polish.svg' })), false);
  assert.strictEqual(imageCaptionIsWarranted(image({ alt: '  ' })), false);

  assert.strictEqual(getImageCaption(image({ title: 'A title', alt: 'Alt text' })), 'A title');
  assert.strictEqual(getImageCaption(image({ title: '  ', alt: 'Alt text worth showing' })), 'Alt text worth showing');
  assert.strictEqual(getImageCaption(image({ alt: 'photo' })), '');
  assert.strictEqual(getImageCaption(image({ alt: '  ' })), '');

  // enhanceImagePresentation: polish without figure when no caption / inside <p>
  class FakeEl {
    constructor(tagName = 'div') {
      this.tagName = tagName.toUpperCase();
      this.attributes = {};
      this.className = '';
      this.classList = {
        _set: new Set(),
        add(name) { this._set.add(name); this.parent.className = [...this._set].join(' '); },
        remove(name) { this._set.delete(name); },
        contains(name) { return this._set.has(name); },
      };
      this.classList.parent = this;
      this.children = [];
      this.parentElement = null;
      this.textContent = '';
    }
    setAttribute(n, v) { this.attributes[n] = v; }
    getAttribute(n) { return this.attributes[n] ?? null; }
    closest(sel) {
      let n = this;
      while (n) {
        if (sel.startsWith('figure') && n.tagName === 'FIGURE' && n.attributes['data-vditor-image-figure']) return n;
        n = n.parentElement;
      }
      return null;
    }
    querySelector(sel) {
      if (sel === 'img') return this.children.find((c) => c.tagName === 'IMG') || null;
      return null;
    }
    querySelectorAll(sel) {
      const out = [];
      const walk = (node) => {
        if (sel.startsWith('figure') && node.tagName === 'FIGURE') out.push(node);
        if (sel.startsWith('img') && node.tagName === 'IMG' && node.classList.contains('vditor-image-polished')) out.push(node);
        for (const c of node.children || []) walk(c);
      };
      for (const c of this.children) walk(c);
      return out;
    }
    insertBefore(node, ref) {
      node.parentElement = this;
      const i = this.children.indexOf(ref);
      if (i === -1) this.children.push(node); else this.children.splice(i, 0, node);
    }
    appendChild(node) {
      if (node.parentElement) {
        node.parentElement.children = node.parentElement.children.filter((c) => c !== node);
      }
      node.parentElement = this;
      this.children.push(node);
    }
    replaceWith(node) {
      const p = this.parentElement;
      const i = p.children.indexOf(this);
      node.parentElement = p;
      p.children.splice(i, 1, node);
    }
    remove() {
      if (!this.parentElement) return;
      this.parentElement.children = this.parentElement.children.filter((c) => c !== this);
    }
  }

  global.document = { createElement: (tag) => new FakeEl(tag) };

  const { enhanceImagePresentation, stripImagePresentationFromClone } = require(outfile);

  // Decorative alt: polish only, no figure
  const p1 = new FakeEl('div');
  const img1 = new FakeEl('img');
  img1.setAttribute('alt', 'photo');
  img1.parentElement = p1;
  p1.children = [img1];
  enhanceImagePresentation(img1);
  assert.ok(img1.classList.contains('vditor-image-polished'));
  assert.strictEqual(p1.children[0].tagName, 'IMG');

  // Warranted caption outside <p>: wrap figure
  const div = new FakeEl('div');
  const img2 = new FakeEl('img');
  img2.setAttribute('title', 'A small local sample figure');
  img2.parentElement = div;
  div.children = [img2];
  enhanceImagePresentation(img2);
  assert.strictEqual(div.children[0].tagName, 'FIGURE');
  assert.strictEqual(div.children[0].children[1].tagName, 'FIGCAPTION');

  // Warranted caption inside <p>: polish only, do not split paragraph
  const para = new FakeEl('p');
  const img3 = new FakeEl('img');
  img3.setAttribute('alt', 'Reading Surface sample');
  img3.parentElement = para;
  para.children = [img3];
  enhanceImagePresentation(img3);
  assert.ok(img3.classList.contains('vditor-image-polished'));
  assert.strictEqual(para.children[0].tagName, 'IMG');

  stripImagePresentationFromClone(div);
  assert.strictEqual(div.children[0].tagName, 'IMG');

  console.log('image figure unit tests passed');
} finally {
  try { fs.unlinkSync(outfile); } catch (_) { /* ignore */ }
}
