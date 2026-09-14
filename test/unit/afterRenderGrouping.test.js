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
  const schedule = loadModule('vditor/src/ts/util/historySchedule.ts', 'history-schedule');
  const lastRecordAt = Date.now() - 10_000;
  assert.strictEqual(schedule.getHistoryRecordWait(lastRecordAt, 600, 1), 0);
  assert.strictEqual(schedule.getHistoryRecordWait(lastRecordAt, 600, 1, true), 600);
  assert.strictEqual(schedule.getHistoryRecordWait(lastRecordAt, 600, -1, true), 600);

  const afterRender = source('vditor/src/ts/wysiwyg/afterRenderEvent.ts');
  assert.match(afterRender, /getHistoryRecordWait\([\s\S]*getHistoryMaxWaitFactor\(vditor\),[\s\S]*options\.enableAddUndoStack !== false,\s*\)/);
  assert.match(afterRender, /options\.enableAddUndoStack === false/);
  assert.match(afterRender, /recordHistory\(vditor, options\)/);
  assert.match(afterRender, /commitAuthoredEdit\(vditor, \{[\s\S]*intent: "prose"[\s\S]*\}\)/);
  assert.doesNotMatch(afterRender, /clearTimeout\(vditor\.wysiwyg\.afterRenderTimeoutId\);\s*recordHistory\(vditor\)/);

  const input = source('vditor/src/ts/wysiwyg/input.ts');
  assert.match(input, /afterRenderEvent\(vditor, \{/);

  const historyBuffer = source('vditor/src/ts/util/historyInputBuffer.ts');
  assert.match(historyBuffer, /commitAuthoredEdit/);
  assert.match(historyBuffer, /intent: "prose"/);
  assert.match(historyBuffer, /flushBufferedHistoryOnClick/);

  const dedupe = loadModule('vditor/src/ts/util/editTransactionDedupe.ts', 'after-render-dedupe');
  assert.strictEqual(dedupe.shouldSkipCommit('same', 'same'), true);
  assert.strictEqual(dedupe.shouldSkipCommit('prior', 'next'), false);

  console.log('afterRender grouping unit tests passed');
}

main();
