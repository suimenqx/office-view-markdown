const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { buildSync } = require('esbuild');

function loadPlantumlServerModule() {
  const entry = path.join(__dirname, '..', '..', 'src', 'common', 'plantumlServer.ts');
  const outfile = path.join(os.tmpdir(), `plantumlServer-test-${process.pid}.cjs`);
  buildSync({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile,
    logLevel: 'silent',
  });
  try {
    // Fresh require each run
    delete require.cache[require.resolve(outfile)];
    return require(outfile);
  } finally {
    try { fs.unlinkSync(outfile); } catch (_) { /* ignore */ }
  }
}

function main() {
  const {
    normalizePlantumlServerBase,
    isPlantumlServerConfigured,
    buildPlantumlRenderUrl,
    looksLikePlantumlImage,
    buildPlantumlTestUrl,
    PLANTUML_TEST_ENCODED,
  } = loadPlantumlServerModule();

  assert.strictEqual(normalizePlantumlServerBase('  https://example.com/plantuml/  '), 'https://example.com/plantuml');
  assert.strictEqual(normalizePlantumlServerBase(''), '');
  assert.strictEqual(normalizePlantumlServerBase(undefined), '');
  assert.strictEqual(isPlantumlServerConfigured(''), false);
  assert.strictEqual(isPlantumlServerConfigured('   '), false);
  assert.strictEqual(isPlantumlServerConfigured('https://host/plantuml'), true);

  assert.strictEqual(
    buildPlantumlRenderUrl('https://example.com/plantuml', 'ABC'),
    'https://example.com/plantuml/svg/~1ABC',
  );
  assert.strictEqual(
    buildPlantumlRenderUrl('https://example.com/plantuml/', 'ABC'),
    'https://example.com/plantuml/svg/~1ABC',
  );
  assert.strictEqual(
    buildPlantumlRenderUrl('https://example.com/plantuml/svg', 'ABC'),
    'https://example.com/plantuml/svg/~1ABC',
  );
  assert.strictEqual(
    buildPlantumlRenderUrl('https://example.com/plantuml/png/', 'ABC'),
    'https://example.com/plantuml/png/~1ABC',
  );
  assert.strictEqual(
    buildPlantumlTestUrl('https://host/plantuml'),
    `https://host/plantuml/svg/~1${PLANTUML_TEST_ENCODED}`,
  );

  assert.throws(() => buildPlantumlRenderUrl('', 'ABC'), /not configured/);
  assert.throws(() => buildPlantumlRenderUrl('   ', 'ABC'), /not configured/);

  assert.strictEqual(looksLikePlantumlImage('image/svg+xml', ''), true);
  assert.strictEqual(looksLikePlantumlImage('text/html', '<svg xmlns'), true);
  assert.strictEqual(looksLikePlantumlImage('text/plain', 'nope'), false);

  const renderSrc = fs.readFileSync(
    path.join(__dirname, '..', '..', 'vditor', 'src', 'ts', 'markdown', 'plantumlRender.ts'),
    'utf8',
  );
  assert.ok(!/plantuml\.com/.test(renderSrc), 'plantumlRender.ts must not hardcode plantuml.com');
  assert.ok(/placeholder/i.test(renderSrc), 'plantumlRender.ts should show a placeholder when unconfigured');

  const helperSrc = fs.readFileSync(
    path.join(__dirname, '..', '..', 'src', 'common', 'plantumlServer.ts'),
    'utf8',
  );
  assert.ok(!/Authorization|Basic |Bearer |token/i.test(helperSrc), 'must not implement server auth');

  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8'));
  const sections = Array.isArray(pkg.contributes.configuration)
    ? pkg.contributes.configuration
    : [pkg.contributes.configuration];
  const keys = sections.flatMap((s) => Object.keys((s && s.properties) || {}));
  assert.ok(keys.includes('office-view-markdown.plantuml.server'));
  const setting = sections
    .map((s) => s.properties && s.properties['office-view-markdown.plantuml.server'])
    .find(Boolean);
  assert.strictEqual(setting.default, '');
  assert.ok((pkg.contributes.commands || []).some((c) => c.command === 'office-view-markdown.plantuml.testServer'));

  console.log('plantumlServer unit tests passed');
}

main();
