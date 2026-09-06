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

function main() {
  const store = new Map();
  global.localStorage = {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); },
    clear() { store.clear(); },
    key(i) { return [...store.keys()][i] ?? null; },
    get length() { return store.size; },
  };

  const docState = loadModule('vditor/src/ts/util/documentState.ts', 'documentState');
  const {
    buildDocumentCacheId,
    getFocusStateKey,
    getScrollStateKey,
    planOpenDocumentRestore,
    saveDocumentScroll,
    clearDocumentScroll,
    beginOpenDocumentRestore,
    isOpenDocumentRestoring,
    endOpenDocumentRestore,
  } = docState;

  assert.deepStrictEqual(planOpenDocumentRestore(true), { restoreScroll: true, restoreCaret: true });
  assert.deepStrictEqual(planOpenDocumentRestore(false), { restoreScroll: true, restoreCaret: false });
  assert.deepStrictEqual(planOpenDocumentRestore(undefined), { restoreScroll: true, restoreCaret: true });

  const cacheId = buildDocumentCacheId('file', 'file:///tmp/LongOpen.md');
  assert.strictEqual(getScrollStateKey(cacheId), `${cacheId}-scroll`);
  assert.strictEqual(getFocusStateKey(cacheId), `${cacheId}-focus`);

  const vditor = { options: { cache: { id: cacheId } }, currentMode: 'wysiwyg', wysiwyg: { element: { scrollTop: 0 } }, ir: { element: { scrollTop: 0 } } };
  saveDocumentScroll(vditor, 1280);
  assert.strictEqual(localStorage.getItem(getScrollStateKey(cacheId)), '1280');
  clearDocumentScroll(cacheId);
  assert.strictEqual(localStorage.getItem(getScrollStateKey(cacheId)), null);

  beginOpenDocumentRestore(vditor);
  assert.strictEqual(isOpenDocumentRestoring(vditor), true);
  endOpenDocumentRestore(vditor);
  assert.strictEqual(isOpenDocumentRestoring(vditor), false);

  // Boot guard: hold shell until chrome ready; first paint uses editorFontSize seam.
  const indexHtml = fs.readFileSync(path.join(root, 'resource/markdown/index.html'), 'utf8');
  const indexCss = fs.readFileSync(path.join(root, 'resource/markdown/index.css'), 'utf8');
  const indexJs = fs.readFileSync(path.join(root, 'resource/markdown/index.js'), 'utf8');
  assert.match(indexHtml, /class="ovm-boot"/);
  assert.match(indexCss, /html\.ovm-boot body/);
  assert.match(indexCss, /visibility:\s*hidden/);
  assert.match(indexJs, /classList\.remove\("ovm-boot"\)/);
  assert.match(indexJs, /setEditorFontSize\(editorFontSize\)/);
  assert.match(indexJs, /restoreDocumentSession\(true, !!shouldRestoreFocus, revealReadingSurface\)/);

  // Host fallback matches package default true.
  const provider = fs.readFileSync(path.join(root, 'src/provider/markdownEditorProvider.ts'), 'utf8');
  assert.match(provider, /config\.get<boolean>\("restoreViewState", true\)/);
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const configuration = pkg.contributes.configuration.flatMap((section) => Object.entries(section.properties || {}));
  const restoreEntry = configuration.find(([key]) => key === 'office-view-markdown.restoreViewState');
  assert.ok(restoreEntry);
  assert.strictEqual(restoreEntry[1].default, true);

  assert.ok(fs.existsSync(path.join(root, 'test/markdown/LongOpen.md')));
  assert.ok(fs.existsSync(path.join(root, '.scratch/open-doc-stable/SMOKE-OPEN.md')));

  console.log('open-doc-stable unit tests passed');
}

main();
