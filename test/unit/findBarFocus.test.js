const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildSync } = require('esbuild');

const root = path.join(__dirname, '..', '..');

function loadModule(entryPoint, name) {
  const outfile = path.join(os.tmpdir(), `${name}-test-${process.pid}.cjs`);
  buildSync({
    entryPoints: [path.join(root, entryPoint)],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile,
    logLevel: 'silent',
  });
  try {
    delete require.cache[require.resolve(outfile)];
    return require(outfile);
  } finally {
    try { fs.unlinkSync(outfile); } catch (_) { /* ignore */ }
  }
}

function source(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function main() {
  const focus = loadModule('vditor/src/ts/util/findFocus.ts', 'find-focus');
  const findInput = {};
  const replaceInput = {};
  const editor = {};

  assert.strictEqual(focus.isFindFieldFocused(findInput, findInput, replaceInput), true);
  assert.strictEqual(focus.isFindFieldFocused(replaceInput, findInput, replaceInput), true);
  assert.strictEqual(focus.isFindFieldFocused(editor, findInput, replaceInput), false);
  assert.strictEqual(focus.shouldStealEditorFocusForMatch(true, false), false);
  assert.strictEqual(focus.shouldStealEditorFocusForMatch(false, true), false);
  assert.strictEqual(focus.shouldStealEditorFocusForMatch(false, false), true);

  const findBar = source('vditor/src/ts/ui/FindBar.ts');
  assert.match(findBar, /isFindFieldFocused\(document\.activeElement, this\.input, this\.replaceInput\)/);
  assert.match(findBar, /shouldStealEditorFocusForMatch\(/);
  assert.match(findBar, /rendered\?\.kind === "code" && mayStealEditorFocus/);
  assert.match(findBar, /rendered\?\.kind === "prose" && mayStealEditorFocus/);
  assert.match(findBar, /this\.input\.addEventListener\("keypress", \(e\) => e\.stopPropagation\(\)\)/);
  assert.match(findBar, /this\.replaceInput\.addEventListener\("keypress", \(e\) => e\.stopPropagation\(\)\)/);
  assert.match(findBar, /target\.setSelectionRange\(selectionStart, selectionEnd\)/);
  assert.match(findBar, /commitAuthoredEdit\(this\.vditor, \{ intent: "findReplace" \}\)/);

  console.log('findBar focus unit tests passed');
}

main();
