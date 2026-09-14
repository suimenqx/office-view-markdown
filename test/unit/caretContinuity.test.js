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
  const position = loadModule('vditor/src/ts/util/documentPosition.ts', 'document-position');

  assert.strictEqual(position.clampDocumentOffset(-4, 10), 0);
  assert.strictEqual(position.clampDocumentOffset(14, 10), 10);
  assert.strictEqual(position.clampDocumentOffset(Number.NaN, 10), 0);
  assert.strictEqual(position.documentAffinity(0, 0), 'none');
  assert.strictEqual(position.documentAffinity(2, 8), 'forward');
  assert.strictEqual(position.documentAffinity(8, 2), 'backward');

  const backward = position.createDocumentPosition({
    mode: 'wysiwyg',
    surface: 'prose',
    blockKey: 'prose:2',
    anchor: 18,
    head: 4,
    presentation: 'edit',
  });
  assert.deepStrictEqual(
    position.roundTripDocumentPosition(backward, 10),
    { ...backward, anchor: 10, head: 4, affinity: 'backward' },
  );
  assert.strictEqual(position.createDocumentBlockKey('code', 3), 'code:3');

  const boundary = position.mapDocumentBoundary(backward, {
    surface: 'code',
    blockKey: 'code:1',
    offset: 99,
    presentation: 'edit',
  });
  assert.deepStrictEqual(boundary, {
    ...backward,
    surface: 'code',
    blockKey: 'code:1',
    anchor: 99,
    head: 99,
    affinity: 'none',
    presentation: 'edit',
  });
  assert.strictEqual(position.resolveDocumentBoundaryTarget('ArrowUp', true, false, true, false), 'previous');
  assert.strictEqual(position.resolveDocumentBoundaryTarget('ArrowDown', false, true, false, true), 'next');
  assert.strictEqual(position.resolveDocumentBoundaryTarget('ArrowRight', false, true, true, false), null);

  const manager = source('vditor/src/ts/codeBlock/codeMirrorManager.ts');
  assert.match(manager, /ADR 0010/);
  assert.match(manager, /rememberCodeMirrorDocumentPosition/);
  assert.match(manager, /restoreCodeMirrorFocus\(blockElement, position\.anchor, position\.head, vditor\)/);
  assert.match(manager, /restoreSessionDocumentPositionAfterRemount/);
  assert.match(manager, /focusCodeMirrorAtDocumentPosition/);
  assert.match(manager, /scrollIntoView: false/);
  assert.doesNotMatch(manager, /scrollElementIntoEditorView/);

  const navigation = source('vditor/src/ts/codeBlock/codeMirrorNavigation.ts');
  assert.match(navigation, /resolveDocumentBoundaryTarget/);
  assert.match(navigation, /ArrowLeft/);
  assert.match(navigation, /ArrowRight/);
  assert.match(navigation, /Home/);
  assert.match(navigation, /End/);

  const selection = source('vditor/src/ts/util/selection.ts');
  assert.match(selection, /getDocumentPositionFromRange/);
  assert.match(selection, /restoreDocumentPositionInEditor/);
  assert.match(selection, /anchorBlockKey/);

  const cacheFocus = source('vditor/src/ts/util/cacheFocus.ts');
  assert.match(cacheFocus, /ADR 0010/);
  assert.match(cacheFocus, /rememberCodeMirrorDocumentPosition/);
  assert.match(cacheFocus, /rememberProseDocumentPosition/);

  const chrome = source('vditor/src/ts/codeBlock/codeBlockChrome.ts');
  assert.match(chrome, /ADR 0010/);
  assert.match(chrome, /key === "Tab"/);
  assert.match(chrome, /contentDOM\.focus\(\{ preventScroll: true \}\)/);

  const wysiwyg = source('vditor/src/ts/wysiwyg/showCode.ts');
  assert.match(wysiwyg, /single click enters/);
  assert.doesNotMatch(wysiwyg, /dblclick/);

  const codeMirrorLess = source('vditor/src/assets/less/_codemirror.less');
  assert.match(codeMirrorLess, /\.cm-editor\s*\{[\s\S]*outline: none/);
  assert.match(codeMirrorLess, /--editor-focus-token/);
  assert.match(codeMirrorLess, /\.cm-editor\.cm-focused/);
  const wysiwygLess = source('vditor/src/assets/less/_wysiwyg.less');
  const irLess = source('vditor/src/assets/less/_ir.less');
  assert.match(wysiwygLess, /::selection/);
  assert.match(irLess, /::selection/);

  const packageJson = JSON.parse(source('package.json'));
  const customEditor = packageJson.contributes.customEditors.find((editor) => editor.viewType === 'office-view-markdown.markdownViewer');
  assert.ok(customEditor, 'acceptance surface must remain markdownViewer');
  assert.ok(fs.existsSync(path.join(root, '.scratch/caret-continuity/SMOKE.md')));

  console.log('caret continuity unit tests passed');
}

main();
