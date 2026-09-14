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

function fakeHost(connected = true) {
  const attrs = {};
  return {
    isConnected: connected,
    attributes: attrs,
    getAttribute(name) { return attrs[name] ?? null; },
    setAttribute(name, value) { attrs[name] = String(value); },
  };
}

function main() {
  const gen = loadModule('vditor/src/ts/util/asyncRenderGeneration.ts', 'async-render-generation');
  gen.resetAsyncRenderGenerationsForTests();

  // --- allow commit when tuple current + connected ---
  const hostA = fakeHost(true);
  const g1 = gen.beginAsyncRenderGeneration(hostA, 'graph TD; A-->B', gen.fingerprintThemeConfig('mermaid', 'Auto'));
  assert.ok(gen.canCommitAsyncRender(g1, hostA), 'current + connected should allow commit');
  assert.strictEqual(hostA.getAttribute(gen.ASYNC_RENDER_BLOCK_ID_ATTR), g1.blockIdentity);

  // --- deny when source revision superseded ---
  const g2 = gen.beginAsyncRenderGeneration(hostA, 'graph TD; A-->C', gen.fingerprintThemeConfig('mermaid', 'Auto'));
  assert.strictEqual(gen.canCommitAsyncRender(g1, hostA), false, 'stale source generation must deny');
  assert.ok(gen.canCommitAsyncRender(g2, hostA), 'new source generation may commit');

  // --- deny when theme/config superseded ---
  const g3 = gen.beginAsyncRenderGeneration(hostA, 'graph TD; A-->C', gen.fingerprintThemeConfig('mermaid', 'Dark'));
  assert.strictEqual(gen.canCommitAsyncRender(g2, hostA), false, 'theme change must deny prior');
  assert.ok(gen.canCommitAsyncRender(g3, hostA), 'new theme generation may commit');

  // --- deny when host disconnected ---
  const detached = fakeHost(false);
  const gDetached = gen.beginAsyncRenderGeneration(detached, 'src', gen.fingerprintThemeConfig('image'));
  assert.strictEqual(gen.canCommitAsyncRender(gDetached, detached), false, 'disconnected host must deny');
  assert.strictEqual(gen.canCommitAsyncRender(g3, null), false, 'null host must deny');

  // --- supersede / invalidate ---
  gen.supersedeAsyncRenderBlock(g3.blockIdentity);
  assert.strictEqual(gen.canCommitAsyncRender(g3, hostA), false, 'superseded block denies');

  const hostB = fakeHost(true);
  const themeKey = gen.fingerprintThemeConfig('mermaid', 'Forest');
  const gTheme = gen.beginAsyncRenderGeneration(hostB, 'x', themeKey);
  gen.invalidateAsyncRenderThemeConfig(themeKey);
  assert.strictEqual(gen.canCommitAsyncRender(gTheme, hostB), false, 'theme invalidate denies');

  const hostC = fakeHost(true);
  const gAll = gen.beginAsyncRenderGeneration(hostC, 'y', gen.fingerprintThemeConfig('plantuml', 'https://x'));
  gen.invalidateAllAsyncRenderGenerations();
  assert.strictEqual(gen.canCommitAsyncRender(gAll, hostC), false, 'invalidate-all denies');

  // --- Retry-after-edit helper ---
  assert.strictEqual(gen.shouldRereadSourceForRetry('old', 'new'), true);
  assert.strictEqual(gen.shouldRereadSourceForRetry('same', 'same'), false);

  // Simulated Retry-after-edit: closed-over gen denied; fresh begin with new source allowed.
  gen.resetAsyncRenderGenerationsForTests();
  const retryHost = fakeHost(true);
  const closedOver = gen.beginAsyncRenderGeneration(retryHost, 'old-src', gen.fingerprintThemeConfig('mermaid', 'Auto'));
  const afterEdit = gen.beginAsyncRenderGeneration(retryHost, 'edited-src', gen.fingerprintThemeConfig('mermaid', 'Auto'));
  assert.strictEqual(gen.canCommitAsyncRender(closedOver, retryHost), false);
  assert.ok(gen.canCommitAsyncRender(afterEdit, retryHost));
  assert.ok(gen.shouldRereadSourceForRetry('old-src', 'edited-src'));

  // --- Source policy: wiring re-reads current source; no closed-over Retry snapshot ---
  const mermaidSrc = source('vditor/src/ts/markdown/mermaidRender.ts');
  assert.match(mermaidSrc, /ADR 0013|asyncRenderGeneration|canCommitAsyncRender/);
  assert.match(mermaidSrc, /beginAsyncRenderGeneration/);
  assert.match(mermaidSrc, /getMermaidSource\(item\)\.trim\(\)/, 'Retry must re-read current Mermaid source');
  assert.doesNotMatch(
    mermaidSrc,
    /const retry = \(\) => \{\s*void renderSingleMermaid\(item, code/,
    'Retry must not close over first-failure code snapshot',
  );
  assert.match(mermaidSrc, /invalidateAllAsyncRenderGenerations/, 'theme refresh invalidates in-flight');
  assert.match(mermaidSrc, /MERMAID_LOADING_ATTR|data-async-render-loading/, 'loading phase for 三态互斥');
  assert.doesNotMatch(mermaidSrc, /commitAuthoredEdit/);
  assert.doesNotMatch(mermaidSrc, /\.focus\s*\(/);
  assert.doesNotMatch(mermaidSrc, /scrollIntoView/);

  const plantumlSrc = source('vditor/src/ts/markdown/plantumlRender.ts');
  assert.match(plantumlSrc, /canCommitAsyncRender/);
  assert.match(plantumlSrc, /beginAsyncRenderGeneration/);
  assert.match(plantumlSrc, /PLANTUML_SOURCE_ATTR/);
  assert.match(plantumlSrc, /readPlantumlSource/);
  assert.doesNotMatch(plantumlSrc, /commitAuthoredEdit/);
  assert.doesNotMatch(plantumlSrc, /\.focus\s*\(/);
  assert.doesNotMatch(plantumlSrc, /www\.plantuml\.com/);

  const imageSrc = source('vditor/src/ts/util/editorCommonEvent.ts');
  assert.match(imageSrc, /beginAsyncRenderGeneration/);
  assert.match(imageSrc, /canCommitAsyncRender/);
  assert.match(imageSrc, /img\.getAttribute\("src"\)/, 'Retry re-reads current src');
  assert.doesNotMatch(imageSrc, /commitAuthoredEdit/);

  console.log('asyncRenderGeneration.test.js: ok');
}

main();
