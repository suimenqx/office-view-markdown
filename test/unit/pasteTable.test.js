const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildSync } = require('esbuild');

const root = path.join(__dirname, '..', '..');
const outfile = path.join(os.tmpdir(), `pasteTable-test-${process.pid}.cjs`);

buildSync({
  entryPoints: [path.join(root, 'vditor/src/ts/util/pasteRouting.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile,
  logLevel: 'silent',
});

try {
  const {
    isPasteHTMLDegraded,
    restoreTableCellBreaks,
    routePasteClipboard,
  } = require(outfile);

  const vscodeRoute = routePasteClipboard(
    '<pre class="syntax-highlight"><span>const value = 1;</span></pre>',
    'const value = 1;',
    '{"mode":"typescript"}',
  );
  assert.deepStrictEqual(vscodeRoute, { textHTML: '', textPlain: 'const value = 1;' });

  const markdownTable = '| Name | Notes |\n| --- | --- |\n| alpha | first |';
  assert.deepStrictEqual(
    routePasteClipboard('<table><tr><td>alpha</td></tr></table>', markdownTable, ''),
    { textHTML: '', textPlain: markdownTable },
  );
  assert.strictEqual(isPasteHTMLDegraded('<p style="color: red">text</p>'), true);
  assert.strictEqual(isPasteHTMLDegraded('<p><strong>text</strong></p>'), false);

  // Lute turns pasted table-cell <br> into a readonly HTML-inline span. The
  // routing seam restores it before insertion so Markdown export keeps it.
  require(path.join(root, 'vditor/src/js/lute/lute.min.js'));
  const lute = global.Lute.New();
  const sourceHTML = '<table><thead><tr><th>H</th></tr></thead>'
    + '<tbody><tr><td>alpha<br>beta</td></tr></tbody></table>';
  const modelHTML = restoreTableCellBreaks(lute.HTML2VditorDOM(sourceHTML));
  assert.match(modelHTML, /data-vditor-table-break="true"/);
  const exportedMarkdown = lute.VditorDOM2Md(modelHTML);
  assert.match(exportedMarkdown, /\| alpha<br\s*\/?\s*>beta \|/);

  const resetStyles = fs.readFileSync(path.join(root, 'vditor/src/assets/less/_reset.less'), 'utf8');
  const tableHandleStyles = fs.readFileSync(path.join(root, 'vditor/src/assets/less/_tableHandle.less'), 'utf8');
  assert.match(resetStyles, /vditor-table-cell--focused/);
  assert.match(resetStyles, /vditor-table-row--active/);
  assert.match(resetStyles, /vditor-table-column--dragging/);
  assert.match(tableHandleStyles, /var\(--table-drop-line/);

  console.log('paste/table polish unit tests passed');
} finally {
  try { fs.unlinkSync(outfile); } catch (_) { /* ignore */ }
}
