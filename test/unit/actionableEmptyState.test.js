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
  constructor() {
    this.children = [];
    this.attributes = {};
    this.listeners = {};
    this.className = '';
    this.textContent = '';
  }

  setAttribute(name, value) { this.attributes[name] = value; }
  addEventListener(name, listener) { this.listeners[name] = listener; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
}

global.document = { createElement: () => new FakeElement() };

try {
  const { renderActionableEmptyState } = require(outfile);
  const rootElement = new FakeElement();
  let clicked = false;
  renderActionableEmptyState(rootElement, {
    title: 'Render failed',
    body: 'Try again.',
    actionLabel: 'Retry',
    onAction: () => { clicked = true; },
  });
  const state = rootElement.children[0];
  assert.strictEqual(state.className, 'vditor-actionable-empty-state');
  assert.strictEqual(state.attributes['data-vditor-generated'], 'true');
  assert.deepStrictEqual(state.children.map((child) => child.textContent), [
    'Render failed', 'Try again.', 'Retry',
  ]);
  state.children[2].listeners.click({ preventDefault() {}, stopPropagation() {} });
  assert.strictEqual(clicked, true);
  console.log('actionable empty state unit tests passed');
} finally {
  try { fs.unlinkSync(outfile); } catch (_) { /* ignore */ }
}
