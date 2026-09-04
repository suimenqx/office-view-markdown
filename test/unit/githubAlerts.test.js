const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildSync } = require('esbuild');

const root = path.join(__dirname, '..', '..');
const outfile = path.join(os.tmpdir(), `githubAlerts-test-${process.pid}.cjs`);

buildSync({
  entryPoints: [path.join(root, 'vditor/src/ts/markdown/githubAlerts.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile,
  logLevel: 'silent',
});

try {
  const {
    getGitHubAlertClass,
    getGitHubAlertClassForCallout,
    markGitHubAlertSourceTitles,
    stripGitHubAlertPresentation,
  } = require(outfile);
  assert.strictEqual(getGitHubAlertClass('[!NOTE]'), 'alert--note');
  assert.strictEqual(getGitHubAlertClass('  [!warning]: check this'), 'alert--warning');
  assert.strictEqual(getGitHubAlertClass('[!TIP]\nUse this'), 'alert--tip');
  assert.strictEqual(getGitHubAlertClass('[!CAUTION]'), 'alert--caution');
  assert.strictEqual(getGitHubAlertClass('[!IMPORTANT]'), 'alert--important');
  assert.strictEqual(getGitHubAlertClassForCallout('NOTE'), 'alert--note');
  assert.strictEqual(getGitHubAlertClassForCallout('question'), undefined);
  assert.strictEqual(getGitHubAlertClass('ordinary quote'), undefined);
  assert.strictEqual(getGitHubAlertClass('[!NOTEBOOK]'), undefined);

  const title = { removed: false, remove() { this.removed = true; } };
  const icon = { removed: false, remove() { this.removed = true; } };
  const callout = {
    attributes: { 'data-type': 'callout', 'data-subtype': 'NOTE' },
    getAttribute(name) { return this.attributes[name] ?? null; },
    setAttribute(name, value) { this.attributes[name] = value; },
    removeAttribute(name) { delete this.attributes[name]; },
    querySelectorAll(selector) {
      if (selector === '.vditor-callout__title') return [title];
      if (selector === '.vditor-callout__icon') return [icon];
      return [];
    },
  };
  const root = { querySelectorAll() { return [callout]; } };
  markGitHubAlertSourceTitles(root, '> [!NOTE]\n> body');
  assert.strictEqual(callout.getAttribute('data-ovm-github-alert-untitled'), 'true');
  stripGitHubAlertPresentation(root);
  assert.strictEqual(title.removed, true);
  assert.strictEqual(icon.removed, true);
  assert.strictEqual(callout.getAttribute('data-callout-title'), null);

  callout.attributes = { 'data-type': 'callout', 'data-subtype': 'NOTE', 'data-callout-title': 'Title' };
  title.removed = false;
  icon.removed = false;
  markGitHubAlertSourceTitles(root, '> [!NOTE] Title\n> body');
  stripGitHubAlertPresentation(root);
  assert.strictEqual(title.removed, false);
  assert.strictEqual(icon.removed, true);
  console.log('GitHub alert unit tests passed');
} finally {
  try { fs.unlinkSync(outfile); } catch (_) { /* ignore */ }
}
