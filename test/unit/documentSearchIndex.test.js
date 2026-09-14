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
  const idx = loadModule('vditor/src/ts/util/documentSearchIndex.ts', 'document-search-index');

  // Cross-inline prose stream: emphasis/link boundaries must not drop a hit.
  const prose = idx.buildProseSearchSegment({
    blockKey: 'prose:0',
    text: 'fooBARbaz', // authored stream after concatenating foo + **BAR** + baz
    order: 0,
  });
  const cross = idx.findInDocumentSearchIndex([prose], 'oBARb');
  assert.strictEqual(cross.length, 1);
  assert.deepStrictEqual(cross[0].sourceRange, {
    sourceId: 'prose:0',
    blockKey: 'prose:0',
    surface: 'prose',
    start: 2,
    end: 7,
  });

  // Code/math source ranges share blockKey identity whether "mounted" or not.
  const codeUnmounted = idx.buildCodeSearchSegment({
    blockKey: 'code:1',
    text: 'print("semantic-find")\n',
    order: 1,
  });
  const codeMounted = idx.buildCodeSearchSegment({
    blockKey: 'code:1',
    text: 'print("semantic-find")\n',
    order: 1,
    sourceId: 'code:1',
  });
  const unmountedHits = idx.findInDocumentSearchIndex([prose, codeUnmounted], 'semantic-find');
  const mountedHits = idx.findInDocumentSearchIndex([prose, codeMounted], 'semantic-find');
  assert.strictEqual(unmountedHits.length, 1);
  assert.strictEqual(mountedHits.length, 1);
  assert.deepStrictEqual(
    unmountedHits.map((m) => m.id),
    mountedHits.map((m) => m.id),
  );
  assert.strictEqual(unmountedHits[0].sourceRange.blockKey, 'code:1');

  // Mixed document: one honest ordered count across prose + code.
  const mixed = idx.findInDocumentSearchIndex(
    [
      idx.buildProseSearchSegment({ blockKey: 'prose:0', text: 'alpha token beta', order: 0 }),
      idx.buildCodeSearchSegment({ blockKey: 'code:0', text: 'token in code', order: 1 }),
      idx.buildTaskSearchSegment({ blockKey: 'task:0', text: 'task token', order: 2 }),
    ],
    'token',
  );
  assert.strictEqual(mixed.length, 3);
  assert.deepStrictEqual(mixed.map((m) => m.sourceRange.blockKey), ['prose:0', 'code:0', 'task:0']);

  // Exclusion policy: chrome / hidden / aria-hidden stay out.
  assert.strictEqual(idx.isExcludedFromDocumentSearch({ hidden: true }), true);
  assert.strictEqual(idx.isExcludedFromDocumentSearch({ ariaHidden: true }), true);
  assert.strictEqual(idx.isExcludedFromDocumentSearch({ className: 'vditor-find-bar' }), true);
  assert.strictEqual(idx.isExcludedFromDocumentSearch({ className: 'vditor-cm-chrome' }), true);
  assert.strictEqual(idx.isExcludedFromDocumentSearch({ className: 'cm-editor' }), true);
  assert.strictEqual(idx.isExcludedFromDocumentSearch({ className: 'vditor-toolbar' }), true);
  assert.strictEqual(idx.isExcludedFromDocumentSearch({ className: 'paragraph' }), false);
  assert.match(idx.DOCUMENT_SEARCH_EXCLUSION_SELECTOR, /vditor-find-bar/);
  assert.match(idx.DOCUMENT_SEARCH_EXCLUSION_SELECTOR, /aria-hidden/);

  // searchable:false filtered before query (adapter mark for chrome).
  const filtered = idx.findInDocumentSearchIndex([
    idx.createDocumentSearchSegment({
      blockKey: 'chrome:0',
      surface: 'prose',
      text: 'phantom token',
      searchable: false,
      order: 0,
    }),
    idx.buildProseSearchSegment({ blockKey: 'prose:1', text: 'real token', order: 1 }),
  ], 'token');
  assert.strictEqual(filtered.length, 1);
  assert.strictEqual(filtered[0].sourceRange.blockKey, 'prose:1');

  // Replace coherence: same source ranges; count drops after apply.
  const before = idx.findInDocumentSearchIndex(
    [
      idx.buildProseSearchSegment({ blockKey: 'prose:0', text: 'xx hit yy hit zz', order: 0 }),
      idx.buildCodeSearchSegment({ blockKey: 'code:0', text: 'hit in fence', order: 1 }),
    ],
    'hit',
  );
  assert.strictEqual(before.length, 3);
  const replacements = before.map((match) => ({
    sourceId: match.sourceRange.sourceId,
    start: match.sourceRange.start,
    end: match.sourceRange.end,
    insert: 'ok',
  }));
  const applied = idx.applyDocumentSearchReplacements(
    [
      idx.buildProseSearchSegment({ blockKey: 'prose:0', text: 'xx hit yy hit zz', order: 0 }),
      idx.buildCodeSearchSegment({ blockKey: 'code:0', text: 'hit in fence', order: 1 }),
    ],
    replacements,
  );
  assert.strictEqual(applied.applied, 3);
  const after = idx.findInDocumentSearchIndex(applied.segments, 'hit');
  assert.strictEqual(after.length, 0);
  assert.strictEqual(applied.segments[0].text, 'xx ok yy ok zz');
  assert.strictEqual(applied.segments[1].text, 'ok in fence');

  // Source policy: FindBar consumes index + ADR 0009/0010 seams.
  const findBar = source('vditor/src/ts/ui/FindBar.ts');
  assert.match(findBar, /findInDocumentSearchIndex/);
  assert.match(findBar, /DOCUMENT_SEARCH_EXCLUSION_SELECTOR/);
  assert.match(findBar, /commitAuthoredEdit\(this\.vditor, \{ intent: "findReplace" \}\)/);
  assert.match(findBar, /focusCodeMirrorAtDocumentPosition/);
  assert.match(findBar, /setSessionDocumentPosition/);
  assert.match(findBar, /createDocumentPosition/);
  assert.match(findBar, /runPresentationOnly/);
  assert.doesNotMatch(findBar, /recordHistoryChange/);
  assert.doesNotMatch(findBar, /fireContentInput/);

  const intent = source('vditor/src/ts/util/editTransactionState.ts');
  assert.match(intent, /findReplace/);

  const smoke = path.join(root, '.scratch/semantic-find/SMOKE.md');
  assert.ok(fs.existsSync(smoke), 'SMOKE.md should exist');
  const smokeText = fs.readFileSync(smoke, 'utf8');
  assert.match(smokeText, /Find Next|count|Replace/i);

  console.log('documentSearchIndex unit tests passed');
}

main();
