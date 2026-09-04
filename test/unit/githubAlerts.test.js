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
  const { getGitHubAlertClass } = require(outfile);
  assert.strictEqual(getGitHubAlertClass('[!NOTE]'), 'alert--note');
  assert.strictEqual(getGitHubAlertClass('  [!warning]: check this'), 'alert--warning');
  assert.strictEqual(getGitHubAlertClass('[!TIP]\nUse this'), 'alert--tip');
  assert.strictEqual(getGitHubAlertClass('[!CAUTION]'), 'alert--caution');
  assert.strictEqual(getGitHubAlertClass('[!IMPORTANT]'), 'alert--important');
  assert.strictEqual(getGitHubAlertClass('ordinary quote'), undefined);
  assert.strictEqual(getGitHubAlertClass('[!NOTEBOOK]'), undefined);
  console.log('GitHub alert unit tests passed');
} finally {
  try { fs.unlinkSync(outfile); } catch (_) { /* ignore */ }
}
