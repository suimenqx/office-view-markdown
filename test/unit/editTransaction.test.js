const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildSync } = require('esbuild');

const root = path.join(__dirname, '..', '..');

function loadModule(entryPoint, name, alias = {}) {
  const outfile = path.join(os.tmpdir(), `${name}-test-${process.pid}.cjs`);
  buildSync({
    entryPoints: [path.join(root, entryPoint)],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile,
    logLevel: 'silent',
    alias,
  });
  try {
    delete require.cache[require.resolve(outfile)];
    return require(outfile);
  } finally {
    try { fs.unlinkSync(outfile); } catch (_) { /* ignore */ }
  }
}

function main() {
  // Pure state + presentation depth without pulling lute/DOM markdown.
  const state = loadModule('vditor/src/ts/util/editTransactionState.ts', 'editTxState');
  const vditor = { currentMode: 'wysiwyg', options: { undoDelay: 0 } };

  assert.strictEqual(state.isPresentationOnlyActive(vditor), false);
  state.beginPresentationOnly(vditor);
  assert.strictEqual(state.isPresentationOnlyActive(vditor), true);
  state.endPresentationOnly(vditor);
  assert.strictEqual(state.isPresentationOnlyActive(vditor), false);

  state.noteCommittedFingerprint(vditor, 'md-v1');
  assert.strictEqual(state.getLastCommitFingerprint(vditor), 'md-v1');
  state.invalidateCommitFingerprint(vditor);
  assert.strictEqual(state.getLastCommitFingerprint(vditor), undefined);

  const dedupe = loadModule('vditor/src/ts/util/editTransactionDedupe.ts', 'editTxDedupe');
  assert.strictEqual(dedupe.shouldSkipCommit(undefined, 'a'), false);
  assert.strictEqual(dedupe.shouldSkipCommit('a', 'a'), true);
  assert.strictEqual(dedupe.shouldSkipCommit('a', 'b'), false);
  assert.strictEqual(dedupe.nextFingerprintAfterCommit(undefined, 'a', true), 'a');
  assert.strictEqual(dedupe.nextFingerprintAfterCommit('a', 'a', true), 'a'); // skip keeps last
  assert.strictEqual(dedupe.nextFingerprintAfterCommit('a', 'b', true), 'b');
  assert.strictEqual(dedupe.nextFingerprintAfterCommit('a', 'b', false), 'a');

  // Source policy: document undo must not route by CM focus (ADR 0009 / ticket 03).
  const undoSrc = fs.readFileSync(path.join(root, 'vditor/src/ts/undo/index.ts'), 'utf8');
  assert.doesNotMatch(undoSrc, /undoActiveCodeMirror\s*\(/);
  assert.doesNotMatch(undoSrc, /redoActiveCodeMirror\s*\(/);
  assert.doesNotMatch(undoSrc, /canUndoActiveCodeMirror/);
  assert.doesNotMatch(undoSrc, /canRedoActiveCodeMirror/);
  assert.match(undoSrc, /ADR 0009/);
  assert.match(undoSrc, /invalidateCommitFingerprint/);

  const cmSetup = fs.readFileSync(path.join(root, 'vditor/src/ts/codeBlock/codeMirrorSetup.ts'), 'utf8');
  assert.match(cmSetup, /vditorLocalHistoryKeymap/);
  assert.match(cmSetup, /DOCUMENT_HISTORY_KEYS/);
  assert.doesNotMatch(cmSetup, /\.\.\.historyKeymap/);

  const cmManager = fs.readFileSync(path.join(root, 'vditor/src/ts/codeBlock/codeMirrorManager.ts'), 'utf8');
  assert.match(cmManager, /flushScheduledAuthoredEdit/);
  assert.match(cmManager, /scheduleAuthoredEdit/);
  assert.match(cmManager, /commitAuthoredEdit/);

  const coordinator = fs.readFileSync(path.join(root, 'vditor/src/ts/util/editTransaction.ts'), 'utf8');
  assert.match(coordinator, /commitAuthoredEdit/);
  assert.match(coordinator, /runPresentationOnly/);
  assert.match(coordinator, /wouldBeNoopCommit/);
  assert.match(coordinator, /One user intent/);

  const wysiwyg = fs.readFileSync(path.join(root, 'vditor/src/ts/wysiwyg/index.ts'), 'utf8');
  assert.match(wysiwyg, /commitAuthoredEdit\(vditor, \{ intent: "task" \}\)/);

  const smoke = path.join(root, '.scratch/semantic-edit-tx/SMOKE.md');
  assert.ok(fs.existsSync(smoke), 'SMOKE.md should exist');
  const smokeText = fs.readFileSync(smoke, 'utf8');
  assert.match(smokeText, /prose/i);
  assert.match(smokeText, /Ctrl\+Z|undo/i);

  console.log('editTransaction unit tests passed');
}

main();
