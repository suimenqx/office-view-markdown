const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildSync } = require('esbuild');

const root = path.join(__dirname, '..', '..');
const outfile = path.join(os.tmpdir(), `codeBlockLanguageLabel-test-${process.pid}.cjs`);

buildSync({
  entryPoints: [path.join(root, 'vditor/src/ts/codeBlock/codeBlockLanguageHints.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile,
  logLevel: 'silent',
});

global.window = { VditorI18n: { plaintext: 'Plain Text' } };
try {
  const { getCodeBlockLanguageLabel } = require(outfile);
  assert.strictEqual(getCodeBlockLanguageLabel('typescript'), 'TypeScript');
  assert.strictEqual(getCodeBlockLanguageLabel('shellscript'), 'Shell');
  assert.strictEqual(getCodeBlockLanguageLabel('javascriptreact'), 'JSX');
  assert.strictEqual(getCodeBlockLanguageLabel('yaml'), 'YAML');
  assert.strictEqual(getCodeBlockLanguageLabel(''), 'Plain Text');
  console.log('code block language label unit tests passed');
} finally {
  try { fs.unlinkSync(outfile); } catch (_) { /* ignore */ }
}
