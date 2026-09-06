const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildSync } = require('esbuild');

const root = path.join(__dirname, '..', '..');
const outfile = path.join(os.tmpdir(), `actionableEmptyState-test-${process.pid}.cjs`);

buildSync({
  entryPoints: [path.join(root, 'vditor/src/ts/ui/actionableEmptyState.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile,
  logLevel: 'silent',
});

class FakeElement {
  constructor(className = '') {
    this.children = [];
    this.attributes = {};
    this.listeners = {};
    this.className = className;
    this.textContent = '';
    this.disabled = false;
    this.type = '';
  }

  setAttribute(name, value) { this.attributes[name] = value; }
  addEventListener(name, listener) { this.listeners[name] = listener; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  remove() { this._removed = true; }
  querySelectorAll(sel) {
    const out = [];
    const walk = (node) => {
      const classes = String(node.className || '').split(/\s+/);
      if (sel === ".vditor-actionable-empty-state" && classes.includes('vditor-actionable-empty-state')) {
        out.push(node);
      }
      if (sel === "[data-vditor-generated='true']" && node.attributes['data-vditor-generated'] === 'true') {
        out.push(node);
      }
      for (const child of node.children || []) walk(child);
    };
    for (const child of this.children) walk(child);
    return out;
  }
}

global.document = { createElement: () => new FakeElement() };

try {
  const {
    renderActionableEmptyState,
    removeActionableEmptyState,
    sanitizeActionableErrorMessage,
  } = require(outfile);

  const rootElement = new FakeElement();
  let clicked = false;
  renderActionableEmptyState(rootElement, {
    title: 'Render failed',
    body: 'Try again.',
    actionLabel: 'Retry',
    onAction: () => { clicked = true; },
  });
  const state = rootElement.children[0];
  assert.ok(String(state.className).includes('vditor-actionable-empty-state'));
  assert.ok(String(state.className).includes('vditor-actionable-empty-state--warning'),
    'default variant should be warning');
  assert.strictEqual(state.attributes['data-vditor-generated'], 'true');
  assert.strictEqual(state.attributes['data-variant'], 'warning');
  assert.deepStrictEqual(state.children.map((child) => child.textContent), [
    'Render failed', 'Try again.', 'Retry',
  ]);
  state.children[2].listeners.click({ preventDefault() {}, stopPropagation() {} });
  assert.strictEqual(clicked, true);

  const infoRoot = new FakeElement();
  renderActionableEmptyState(infoRoot, {
    title: 'Unconfigured',
    body: 'Open settings.',
    actionLabel: 'Open Settings',
    variant: 'info',
  });
  assert.ok(String(infoRoot.children[0].className).includes('vditor-actionable-empty-state--info'));
  assert.strictEqual(infoRoot.children[0].attributes['data-variant'], 'info');

  const errorRoot = new FakeElement();
  renderActionableEmptyState(errorRoot, {
    title: 'Failed',
    body: 'Reason',
    actionLabel: 'Retry',
    variant: 'error',
  });
  assert.ok(String(errorRoot.children[0].className).includes('vditor-actionable-empty-state--error'));

  const otherGenerated = new FakeElement('vditor-image-error-state');
  otherGenerated.setAttribute('data-vditor-generated', 'true');
  rootElement.children.push(otherGenerated);
  removeActionableEmptyState(rootElement);
  assert.strictEqual(state._removed, true);
  assert.notStrictEqual(otherGenerated._removed, true);

  // sanitize helper
  assert.strictEqual(
    sanitizeActionableErrorMessage(new Error('Parse error on line 2\n    at render (x.js:1:1)')),
    'Parse error on line 2',
  );
  assert.strictEqual(
    sanitizeActionableErrorMessage('    at foo (bar.js:1:1)\nfile:///tmp/x.js\nReal reason'),
    'Real reason',
  );
  const long = 'x'.repeat(200);
  const sanitizedLong = sanitizeActionableErrorMessage(long);
  assert.ok(sanitizedLong.length <= 160);
  assert.ok(sanitizedLong.endsWith('…'));
  assert.strictEqual(
    sanitizeActionableErrorMessage(new Error('    at onlyStack (a.js:1:1)'), 'fallback body'),
    'fallback body',
  );
  assert.strictEqual(
    sanitizeActionableErrorMessage(''),
    'Something went wrong. Please try again.',
  );

  // copy keys present in i18n packs
  const i18nDir = path.join(root, 'vditor/src/js/i18n');
  for (const file of fs.readdirSync(i18nDir).filter((name) => name.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(i18nDir, file), 'utf8');
    for (const key of [
      'actionableMermaidRenderFailedBody',
      'actionablePlantumlRenderFailedBody',
      'actionablePlantumlUnconfigured',
      'actionableImageLoadFailed',
    ]) {
      assert.ok(src.includes(`'${key}'`), `${file} missing ${key}`);
    }
  }
  const zh = fs.readFileSync(path.join(i18nDir, 'zh_CN.js'), 'utf8');
  assert.ok(zh.includes("'actionablePlantumlUnconfigured': '未配置 PlantUML Server'"));
  assert.ok(zh.includes("'actionableImageLoadFailed': '图片加载失败'"));

  console.log('actionable empty state unit tests passed');
} finally {
  try { fs.unlinkSync(outfile); } catch (_) { /* ignore */ }
}
